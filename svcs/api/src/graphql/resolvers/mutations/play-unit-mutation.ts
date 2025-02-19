import { Combat, Game, MutationPlayUnitArgs } from '@gwent/graphql-schema/resolver-typings'
import { Context } from '@gwent/graphql-schema/context'
import {
  DeckUnitDbObject,
  GameDbObject,
  GamePlayerDbObject,
  GameStatus,
  MoveUnitDbObject,
  PlayerCombatRowDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import DeckUnitResolver from '../types/deck-unit-resolver'
import EventManager from '../../event-manager'
import GameDeckResolver from '../types/game-deck-resolver'
import GameResolver from '../types/game-resolver'
import GameStore from '../../../database/stores/game-store'
import { getLogger } from 'log4js'
import { GraphQLResolveInfo } from 'graphql'
import { MoveType } from '@gwent/graphql-schema'
import MutationUtil from './mutation-util'
import PresentableError from '../../../util/presentable-error'
import { PubSubEvents } from '@gwent/constants'
import ResolverUtil from '../resolver-util'
import { UnitPlayedFromDeckPayload, UnitPlayedOnGamePayload } from '../subscription-resolver'
import UnitStore from '../../../database/stores/unit-store'

/**
 * A class for executing the playUnit GraphQL Mutation.
 */
export default class PlayUnitMutation {
  private static logger = getLogger('PlayUnitMutation')

  /**
   * Play a unit for a user on a game.
   *
   * @param args The arguments for playing the unit.
   * @param context The session containing the user playing the unit.
   * @param info The information about the GraphQL request.
   * @returns The Game with the unit played for the user.
   * @throws PresentableError if problem playing unit.
   */
  static async playUnit(args: MutationPlayUnitArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const resolverUtil = new ResolverUtil({
      logger: PlayUnitMutation.logger,
    })

    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'playUnit mutation',
    })
    const gameId = args.game
    const unitId = args.unit
    let combat = args.combat

    const logPrefix = `playUnit by "${userId}" for unit "${unitId}" on game "${gameId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    resolverUtil.verifyMongoIds({
      ids: [unitId],
      label: 'Unit ID',
    })

    const { game, player } = await resolverUtil.getGamePlayer({
      gameId,
      userId,
      status: GameStatus.Playing,
      turn: true,
      label: 'play units',
    })

    const deckUnits = player.deck.hand.filter((hand) => hand.unit.toString() === unitId)
    if (deckUnits.length === 0) {
      const message = 'Unit not in hand.'
      PlayUnitMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    } else if (deckUnits.length > 1) {
      const message = `Found more than 1 unit with ID "${unitId}"`
      PlayUnitMutation.logger.error(`${logPrefix} failed: ${message}: "${JSON.stringify(deckUnits)}"`)
      throw new PresentableError(`${message}.`)
    }
    const deckUnit = deckUnits[0]

    const units = await UnitStore.get({
      ids: [unitId],
    })
    if (units.length === 0) {
      const message = 'Unit does not exist.'
      PlayUnitMutation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    } else if (units.length > 1) {
      const message = `Found multiple units with ID "${unitId}"`
      PlayUnitMutation.logger.error(`${logPrefix} failed: ${message}: "${JSON.stringify(units)}"`)
      throw new PresentableError(`${message}.`)
    }
    const unit = units[0]

    if (unit.combats && unit.combats.length > 1 && !combat) {
      const message = `Must specify combat: One of "${JSON.stringify(unit.combats)}".`
      PlayUnitMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    if (unit.combats && unit.combats.length > 0 && combat && !unit.combats.includes(combat)) {
      const message = `Combat "${combat}" does match unit combats of "${JSON.stringify(unit.combats)}".`
      PlayUnitMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    if (unit.combats && unit.combats.length === 1 && !combat) {
      combat = unit.combats[0] as Combat
    }
    if (!combat) {
      const message = 'Must specify combat.'
      PlayUnitMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    const mutationUtil = new MutationUtil({
      logger: PlayUnitMutation.logger,
      logPrefix,
    })

    // add/remove from hand
    game.players = PlayUnitMutation.addOrRemoveUnits({
      game,
      combat,
      deckUnit,
    })

    // calculate strengths
    const roundUnits = await PlayUnitMutation.getRoundUnits({
      game,
      deckUnit,
    })
    game.players = PlayUnitMutation.calculateEffectiveStrengths({
      game,
      units: [unit, ...roundUnits],
    })

    // calculate scores
    game.players = PlayUnitMutation.calculateScores({
      game,
    })

    game.players = PlayUnitMutation.addMoveToPlayer({
      game,
      combat,
      deckUnit,
    })

    // set next player
    game.turn = mutationUtil.getNextPlayerIdForCurrentRound({
      currentRound: game.round,
      currentTurn: game.turn,
      players: game.players,
    })

    const updatedGame = await GameStore.save(game)

    if (!updatedGame) {
      const message = 'Could not play unit in probable race condition collision.'
      PlayUnitMutation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    const resolvedGame = await GameResolver.fromObject({
      game: updatedGame,
    })
    const resolvedUnit = await DeckUnitResolver.fromObject({
      deckUnit,
    })
    const resolvedGameDeck = await GameDeckResolver.fromObject({
      gameDeck: player.deck,
    })

    EventManager.pubsub.publish(PubSubEvents.UnitPlayedOnGame, {
      unitPlayedOnGame: {
        game: resolvedGame,
        unit: resolvedUnit,
      },
    } as UnitPlayedOnGamePayload)

    EventManager.pubsub.publish(PubSubEvents.UnitPlayedFromDeck, {
      unitPlayedFromDeck: {
        deck: resolvedGameDeck,
        game: resolvedGame,
        unit: resolvedUnit,
      },
    } as UnitPlayedFromDeckPayload)

    return resolvedGame
  }

  private static async getRoundUnits({
    game,
    deckUnit,
  }: {
    game: GameDbObject
    deckUnit: DeckUnitDbObject
  }): Promise<UnitDbObject[]> {
    const unitIds: string[] = [deckUnit.unit.toString()] // to be removed at end, used just for now to ignore potential duplicates
    for (const player of game.players) {
      const round = player.rounds[game.round - 1]
      for (let i = 0; i < player.rounds.length; i++) {
        if (i === game.round - 1) {
          for (const rowUnit of [...round.close.units, ...round.ranged.units, ...round.siege.units]) {
            if (!unitIds.includes(rowUnit.unit.toString())) {
              unitIds.push(rowUnit.unit.toString())
            }
          }
        }
      }
    }

    return UnitStore.get({
      ids: unitIds.slice(1), // remove the deckUnit we have already retrieved
    })
  }

  private static addMoveToPlayer({
    game,
    deckUnit,
    combat,
  }: {
    game: GameDbObject
    deckUnit: DeckUnitDbObject
    combat: Combat
  }) {
    const move: MoveUnitDbObject = {
      created: new Date(),
      row: combat,
      unit: deckUnit,
      type: MoveType.Unit,
    }
    return game.players.map((player) => {
      return {
        ...player,
        rounds: player.rounds.map((round, index) => {
          if (index === game.round - 1) {
            if (player.user.toString() === game.turn?.toString()) {
              round.moves = [...round.moves, move]
            }
          }
          return round
        }),
      }
    })
  }

  private static addOrRemoveUnits({
    game,
    deckUnit,
    combat,
  }: {
    game: GameDbObject
    deckUnit: DeckUnitDbObject
    combat: Combat
  }): GamePlayerDbObject[] {
    return game.players.map((player) => {
      return {
        ...player,
        deck: {
          ...player.deck,
          hand:
            player.user.toString() === game.turn?.toString()
              ? player.deck.hand.filter((handUnit) => handUnit.unit.toString() !== deckUnit.unit.toString())
              : player.deck.hand,
        },
        rounds: player.rounds.map((round, index) => {
          if (index === game.round - 1) {
            if (player.user.toString() === game.turn?.toString()) {
              round.close = PlayUnitMutation.addUnitToCombatRow({
                deckUnit,
                row: round.close,
                rowCombat: Combat.Close,
                unitCombat: combat,
              })
              round.ranged = PlayUnitMutation.addUnitToCombatRow({
                deckUnit,
                row: round.ranged,
                rowCombat: Combat.Ranged,
                unitCombat: combat,
              })
              round.siege = PlayUnitMutation.addUnitToCombatRow({
                deckUnit,
                row: round.siege,
                rowCombat: Combat.Siege,
                unitCombat: combat,
              })
            }
          }
          return round
        }),
      }
    })
  }

  private static addUnitToCombatRow({
    deckUnit,
    unitCombat,
    rowCombat,
    row,
  }: {
    deckUnit: DeckUnitDbObject
    unitCombat: Combat
    rowCombat: Combat
    row: PlayerCombatRowDbObject
  }): PlayerCombatRowDbObject {
    if (unitCombat === rowCombat) {
      row.units.push({
        ...deckUnit,
      })
    }
    return row
  }

  private static calculateEffectiveStrengths({
    game,
    units,
  }: {
    game: GameDbObject
    units: UnitDbObject[]
  }): GamePlayerDbObject[] {
    return game.players.map((player) => {
      return {
        ...player,
        rounds: player.rounds.map((round, index) => {
          if (index === game.round - 1) {
            round.close = PlayUnitMutation.calculateEffectiveStrengthsForRow({
              row: round.close,
              units,
            })
            round.ranged = PlayUnitMutation.calculateEffectiveStrengthsForRow({
              row: round.ranged,
              units,
            })
            round.siege = PlayUnitMutation.calculateEffectiveStrengthsForRow({
              row: round.siege,
              units,
            })
          }
          return round
        }),
      }
    })
  }

  private static calculateEffectiveStrengthsForRow({
    row,
    units,
  }: {
    row: PlayerCombatRowDbObject
    units: UnitDbObject[]
  }): PlayerCombatRowDbObject {
    return {
      ...row,
      units: row.units.map((rowUnit) => {
        const dbUnit = units.find((unit) => unit._id.toString() === rowUnit.unit.toString())
        rowUnit.effectiveStrength = dbUnit?.strength || 0
        return rowUnit
      }),
    }
  }

  private static calculateScores({ game }: { game: GameDbObject }): GamePlayerDbObject[] {
    return game.players.map((player) => {
      return {
        ...player,
        rounds: player.rounds.map((round, index) => {
          if (index === game.round - 1) {
            round.close.score = PlayUnitMutation.calculateScoreForRow({
              row: round.close,
            })
            round.ranged.score = PlayUnitMutation.calculateScoreForRow({
              row: round.ranged,
            })
            round.siege.score = PlayUnitMutation.calculateScoreForRow({
              row: round.siege,
            })
            round.score = round.close.score + round.ranged.score + round.siege.score
          }
          return round
        }),
      }
    })
  }

  private static calculateScoreForRow({ row }: { row: PlayerCombatRowDbObject }): number {
    let score = 0
    for (const unit of row.units) {
      score += unit.effectiveStrength || 0
    }
    return score
  }
}
