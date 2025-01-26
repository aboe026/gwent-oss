import { ObjectId } from 'mongodb'

import { Combat, Game, MutationPlayUnitArgs } from '@gwent/graphql-schema/resolver-typings'
import { Context } from '@gwent/graphql-schema/context'
import DeckUnitResolver from '../types/deck-unit-resolver'
import EventManager from '../../event-manager'
import GameDeckResolver from '../types/game-deck-resolver'
import { GameStatus, MoveUnitDbObject } from '@gwent/graphql-schema/database-typings'
import GameResolver from '../types/game-resolver'
import GameStore from '../../../database/stores/game-store'
import { getLogger } from 'log4js'
import { GraphQLResolveInfo } from 'graphql'
import { MoveType, RequestedFields } from '@gwent/graphql-schema'
import MutationUtil from './mutation-util'
import { NOT_AUTHENTICATED_MESSAGE, PubSubEvents } from '@gwent/constants'
import { UnitPlayedFromDeckPayload, UnitPlayedOnGamePayload } from '../subscription-resolver'
import UnitStore from '../../../database/stores/unit-store'

/**
 * A class for executing the playUnit GraphQL Mutation.
 */
export default class PlayUnitMutation {
  private static logger = getLogger('PlayUnitMutation')

  static async playUnit(args: MutationPlayUnitArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const userId = context.session?.user?._id
    if (!userId) {
      PlayUnitMutation.logger.error(`No user on context for playUnit mutation: "${JSON.stringify(context.session)}".`)
      return Error(NOT_AUTHENTICATED_MESSAGE) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    let logPrefix = `playUnit by "${userId}"`
    if (PlayUnitMutation.logger.isTraceEnabled()) {
      PlayUnitMutation.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
      PlayUnitMutation.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      PlayUnitMutation.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }

    const gameId = args.game
    const unitId = args.unit

    logPrefix += ` for unit "${unitId}" on game "${gameId}"`

    if (!ObjectId.isValid(unitId)) {
      const message = `Unit ID "${unitId}" is not a valid MongoDB ObjectId.`
      PlayUnitMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const response = await MutationUtil.getGamePlayer({
      gameId,
      logPrefix,
      userId,
      status: GameStatus.Playing,
      turn: true,
      label: 'play units',
    })

    if (response instanceof Error) {
      return response as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const { game, player } = response

    const deckUnits = player.deck.hand.filter((hand) => hand.unit.toString() === unitId)
    if (deckUnits.length === 0) {
      const message = 'Unit not in hand.'
      PlayUnitMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    } else if (deckUnits.length > 1) {
      const message = `Found more than 1 unit with ID "${unitId}"`
      PlayUnitMutation.logger.error(`${logPrefix} failed: ${message}: "${JSON.stringify(deckUnits)}"`)
      return Error(`${message}.`) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const deckUnit = deckUnits[0]

    const units = await UnitStore.get({
      ids: [unitId],
    })
    if (units.length === 0) {
      const message = 'Unit does not exist.'
      PlayUnitMutation.logger.error(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    } else if (units.length > 1) {
      const message = `Found multiple units with ID "${unitId}"`
      PlayUnitMutation.logger.error(`${logPrefix} failed: ${message}: "${JSON.stringify(units)}"`)
      return Error(`${message}.`) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const unit = units[0]

    if (!unit.combats || !unit.combats.includes(args.combat)) {
      const message = `Combat "${args.combat}" does match unit combats of "${JSON.stringify(unit.combats)}".`
      PlayUnitMutation.logger.error(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    // play unit
    game.players = game.players.map((gamePlayer) => {
      if (gamePlayer.user.toString() === player.user.toString()) {
        const playerRound = gamePlayer.rounds[game.round - 1]
        const { close, ranged, siege } = playerRound
        const combatRow = args.combat === Combat.Close ? close : args.combat === Combat.Ranged ? ranged : siege
        combatRow.score = combatRow.score + (unit.strength || 0)
        combatRow.units.push({
          ...deckUnit,
          effectiveStrength: unit.strength,
        })
        return {
          ...gamePlayer,
          rounds: gamePlayer.rounds.map((round, index) => {
            if (index === game.round - 1) {
              const move: MoveUnitDbObject = {
                created: new Date(),
                row: args.combat,
                unit: deckUnit,
                type: MoveType.Unit,
              }
              return {
                ...round,
                close,
                moves: [...round.moves, move],
                ranged,
                score: playerRound.score + (unit.strength || 0),
                siege,
              }
            }
            return round
          }),
          deck: {
            ...gamePlayer.deck,
            hand: gamePlayer.deck.hand.filter((deckUnit) => deckUnit.unit.toString() !== unitId),
          },
        }
      }
      return gamePlayer
    })

    // set next player
    const nextPlayerId = MutationUtil.getNextPlayerIdForCurrentRound({
      game,
      logPrefix,
    })
    if (nextPlayerId instanceof Error) {
      return nextPlayerId as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const updatedGame = await GameStore.makeMove({
      nextTurn: nextPlayerId,
      game,
      userId,
    })

    if (!updatedGame) {
      const message = `Could not play unit "${unitId}" for game "${gameId}" in probable race condition collision.`
      PlayUnitMutation.logger.error(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
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
