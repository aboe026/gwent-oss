import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import EventManager from '../../event-manager'
import { Game, MutationReadyArgs } from '@gwent/graphql-schema/resolver-typings'
import { GamePlayerDbObject } from '@gwent/graphql-schema/database-typings'
import GameResolver from '../types/game-resolver'
import GameStore from '../../../database/stores/game-store'
import { GraphQLResolveInfo } from 'graphql'
import MutationUtil from './mutation-util'
import { NOT_AUTHENTICATED_MESSAGE, PubSubEvents } from '@gwent/constants'
import { RequestedFields } from '@gwent/graphql-schema'

/**
 * A class for executing the ready GraphQL Mutation.
 */
export default class ReadyMutation {
  private static logger = getLogger('ReadyMutation')

  /**
   * Mark a Game as ready for a User. Prevents redrawing units after marked as ready.
   *
   * @param args The arguments for marking a game as ready.
   * @param context The session containing the user readying the game.
   * @param info The information about the GraphQL request.
   * @returns The Game that is now ready for the user.
   */
  static async ready(args: MutationReadyArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const userId = context.session?.user?._id
    if (!userId) {
      ReadyMutation.logger.error(`No user on context for ready mutation: "${JSON.stringify(context.session)}".`)
      return Error(NOT_AUTHENTICATED_MESSAGE) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const logPrefix = `ready by "${userId}"`
    if (ReadyMutation.logger.isTraceEnabled()) {
      ReadyMutation.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
      ReadyMutation.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      ReadyMutation.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }
    const gameId = args.game
    if (!ObjectId.isValid(gameId)) {
      const message = `Game ID "${gameId}" is not a valid MongoDB ObjectId.`
      ReadyMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const game = await GameStore.getById({
      id: gameId,
    })
    if (ReadyMutation.logger.isTraceEnabled()) {
      ReadyMutation.logger.trace(`${logPrefix} game: "${JSON.stringify(game)}"`)
    }
    if (!game) {
      const message = `Game with ID "${gameId}" does not exist.`
      ReadyMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const player: GamePlayerDbObject | undefined = game.players.find(
      (player) => player.user.toString() === userId.toString()
    )
    if (ReadyMutation.logger.isTraceEnabled()) {
      ReadyMutation.logger.trace(`${logPrefix} player: "${JSON.stringify(player)}"`)
    }
    if (!player) {
      const message = `Not a player on game "${gameId}".`
      ReadyMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (!player.deck.from) {
      const message = `Must set deck on game "${gameId}" first.`
      ReadyMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (player.ready) {
      const message = `Game "${gameId}" already marked as ready.`
      ReadyMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    game.players = game.players.map((gamePlayer) => {
      let ready = gamePlayer.ready
      if (gamePlayer.user.toString() === userId.toString()) {
        ready = true
      }
      return {
        ...gamePlayer,
        ready,
      }
    })
    const unreadyPlayers = game.players.filter((gamePlayer) => gamePlayer.ready === false)
    if (ReadyMutation.logger.isTraceEnabled()) {
      ReadyMutation.logger.trace(
        `${logPrefix} game "${game._id}" unreadyPlayers: "${JSON.stringify(
          unreadyPlayers.map((unreadyPlayer) => unreadyPlayer.user)
        )}`
      )
    }
    if (unreadyPlayers.length === 0) {
      ReadyMutation.logger.debug(`${logPrefix} game "${game._id}" has all players ready, starting first round`)
      game.players = MutationUtil.initializeNewRound({
        players: game.players,
      })
    }
    const currentRound = unreadyPlayers.length === 0 ? 1 : 0
    ReadyMutation.logger.trace(`${logPrefix} game "${game._id}" currentRound: "${currentRound}`)

    const updatedGame = await GameStore.setReady({
      gameId,
      userId,
      players: game.players,
      previousUpdate: game.updated,
      currentRound,
    })
    if (ReadyMutation.logger.isTraceEnabled()) {
      ReadyMutation.logger.trace(`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`)
    }
    if (!updatedGame) {
      const message = `Could not set player as ready for game "${gameId}" in probable race condition collision.`
      ReadyMutation.logger.error(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const resolvedGame = await GameResolver.fromObject({
      game: updatedGame,
    })

    EventManager.pubsub.publish(PubSubEvents.GameReady, {
      gameReady: resolvedGame,
    })

    return resolvedGame
  }
}
