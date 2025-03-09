import CalculateGameEffectiveStrengths from './util/calculate-game-effective-strengths'
import CalculateGameScores from './util/calculate-game-scores'
import { Combat, Game, MutationPlayUnitArgs } from '@gwent/graphql-schema/resolver-typings'
import { Context } from '@gwent/graphql-schema/context'
import DeckUnitResolver from '../types/deck-unit-resolver'
import EventManager from '../../event-manager'
import GameDeckResolver from '../types/game-deck-resolver'
import GameResolver from '../types/game-resolver'
import { GameStatus, MoveUnitDbObject } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../../database/stores/game-store'
import { getLogger } from 'log4js'
import { GraphQLResolveInfo } from 'graphql'
import ModifyGameUnitPositions from './util/modify-game-unit-positions'
import { MoveType } from '@gwent/graphql-schema'
import PresentableError from '../../../util/presentable-error'
import { PubSubEvents } from '@gwent/constants'
import ResolverUtil from '../resolver-util'
import { UnitPlayedFromDeckPayload, UnitPlayedOnGamePayload } from '../subscription-resolver'
import UnitStore from '../../../database/stores/unit-store'
import UnitUtil from './util/unit-util'
import GetNextPlayerIdForCurrentRound from './util/get-next-player-id-for-current-round'
import AddMoveToPlayer from './util/add-move-to-player'

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

    const roundUnits = await UnitUtil.getRoundUnits({
      game,
      unitBeingPlayed: unit,
    })
    const unitEffects = await UnitUtil.getUnitEffects({
      units: roundUnits,
    })

    ModifyGameUnitPositions.modifyGameUnitPositions({
      game,
      combat,
      deckUnit,
    })

    CalculateGameEffectiveStrengths.calculateEffectiveStrengths({
      game,
      units: [unit, ...roundUnits],
      effects: unitEffects,
    })

    CalculateGameScores.calculateScores({
      game,
    })

    AddMoveToPlayer.addMoveToPlayer({
      game,
      move: {
        created: new Date(),
        row: combat,
        unit: deckUnit,
        type: MoveType.Unit,
      } as MoveUnitDbObject,
    })

    game.turn = GetNextPlayerIdForCurrentRound.getNextPlayerIdForCurrentRound({
      currentRound: game.round,
      currentTurn: game.turn,
      players: game.players,
      logPrefix,
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
}
