import { ObjectId } from 'mongodb'

import { Combat, Game, MutationPlayUnitArgs } from '@gwent/graphql-schema/resolver-typings'
import { Context } from '@gwent/graphql-schema/context'
import DeckUnitResolver from '../types/deck-unit-resolver'
import EventManager from '../../event-manager'
import GameDeckResolver from '../types/game-deck-resolver'
import { GameStatus } from '@gwent/graphql-schema/database-typings'
import GameResolver from '../types/game-resolver'
import GameStore from '../../../database/stores/game-store'
import { getLogger } from 'log4js'
import { GraphQLResolveInfo } from 'graphql'
import MutationUtil from './mutation-util'
import { NOT_AUTHENTICATED_MESSAGE, PubSubEvents } from '@gwent/constants'
import { RequestedFields } from '@gwent/graphql-schema'
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
    const logPrefix = `playUnit by "${userId}"`
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

    if (!ObjectId.isValid(unitId)) {
      const message = `Unit ID "${unitId}" is not a valid MongoDB ObjectId.`
      PlayUnitMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const response = await MutationUtil.getGamePlayer({
      gameId,
      logger: PlayUnitMutation.logger,
      logPrefix,
      userId,
    })

    if (response instanceof Error) {
      return response as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const { game, player } = response

    const gameStatus = GameResolver.getStatus(game)
    if (gameStatus !== GameStatus.Playing) {
      const message = `Invalid game status "${gameStatus}": Can only play units for game with status "${GameStatus.Playing}".`
      PlayUnitMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    // TODO: ensure it is users turn
    // TODO: ensure unit is in players hand

    const deckUnits = player.deck.hand.filter((hand) => hand.unit.toString() === unitId)
    // TODO: throw error if not in hand
    // TODO: throw error if more than 1 in hand
    const deckUnit = deckUnits[0]

    const units = await UnitStore.get({
      ids: [unitId],
    })
    // TODO: throw error if cannot find unit
    const unit = units[0]
    // TODO: throw error if unit cannot be used in row of args.combat

    // play unit
    const currentRound = player.rounds[game.round.current]
    const { close, ranged, siege } = currentRound
    const combatRow = args.combat === Combat.Close ? close : args.combat === Combat.Ranged ? ranged : siege
    combatRow.score = combatRow.score + (unit.strength || 0)
    combatRow.units.push(deckUnit)
    player.rounds[game.round.current] = {
      ...currentRound,
      moves: [
        ...currentRound.moves,
        {
          created: new Date(),
          unit: new ObjectId(unitId),
          type: 'UNIT',
        },
      ],
      score: currentRound.score + (unit.strength || 0),
      close,
      ranged,
      siege,
    }
    player.deck.hand = player.deck.hand.filter((deckUnit) => deckUnit.unit.toString() !== unitId)

    // set next player
    const nextPlayerId = MutationUtil.getNextPlayerId({
      currentPlayer: player,
      game,
      logger: PlayUnitMutation.logger,
      logPrefix,
    })

    if (!nextPlayerId) {
      // all players have passed, end round
      console.log('TEST no next player id')
    }

    const updatedGame = await GameStore.makeMove({
      nextTurn: nextPlayerId,
      updatedGame: {
        ...game,
        players: game.players.map((gamePlayer) => {
          if (gamePlayer.user.toString() === player.user.toString()) {
            return player
          }
          return gamePlayer
        }),
      },
      userId,
    })

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
    })

    EventManager.pubsub.publish(PubSubEvents.UnitPlayedFromDeck, {
      unitPlayedFromDeck: {
        deck: resolvedGameDeck,
        game: resolvedGame,
        unit: resolvedUnit,
      },
    })

    return resolvedGame
  }
}
