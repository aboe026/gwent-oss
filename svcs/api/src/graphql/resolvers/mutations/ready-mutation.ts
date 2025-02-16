import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import EventManager from '../../event-manager'
import { Game, MutationReadyArgs } from '@gwent/graphql-schema/resolver-typings'
import { GameStatus } from '@gwent/graphql-schema/database-typings'
import { GameReadyPayload } from '../subscription-resolver'
import GameResolver from '../types/game-resolver'
import GameStore from '../../../database/stores/game-store'
import { GraphQLResolveInfo } from 'graphql'
import MutationUtil from './mutation-util'
import PresentableError from '../../../util/presentable-error'
import { PubSubEvents } from '@gwent/constants'
import ResolverUtil from '../resolver-util'

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
   * @throws PresentableError if problem marking game as ready.
   */
  static async ready(args: MutationReadyArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const resolverUtil = new ResolverUtil({
      logger: ReadyMutation.logger,
    })
    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'ready mutation',
    })
    const gameId = args.game

    const logPrefix = `ready by "${userId}" on game "${gameId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    const { game, player } = await resolverUtil.getGamePlayer({
      gameId,
      userId,
      status: GameStatus.Redrawing,
      label: 'mark ready',
    })

    if (player.ready) {
      const message = 'Already marked as ready.'
      ReadyMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    const mutationUtil = new MutationUtil({
      logger: ReadyMutation.logger,
      logPrefix,
    })

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
        `${logPrefix} unreadyPlayers: "${JSON.stringify(unreadyPlayers.map((unreadyPlayer) => unreadyPlayer.user))}"`
      )
    }
    if (unreadyPlayers.length === 0) {
      ReadyMutation.logger.debug(`${logPrefix} has all players ready, starting first round.`)
      game.players = mutationUtil.initializeNewRound({
        players: game.players,
      })
      game.round = 1
      game.status = GameStatus.Playing
    }

    const updatedGame = await GameStore.save(game)

    if (ReadyMutation.logger.isTraceEnabled()) {
      ReadyMutation.logger.trace(`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`)
    }
    if (!updatedGame) {
      const message = 'Could not set player as ready in probable race condition collision.'
      ReadyMutation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    const resolvedGame = await GameResolver.fromObject({
      game: updatedGame,
    })

    EventManager.pubsub.publish(PubSubEvents.GameReady, {
      gameReady: resolvedGame,
    } as GameReadyPayload)

    return resolvedGame
  }
}
