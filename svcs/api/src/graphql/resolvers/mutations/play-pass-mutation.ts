import { Game, MutationPlayPassArgs } from '@gwent/graphql-schema/resolver-typings'
import { Context } from '@gwent/graphql-schema/context'
import { GameStatus } from '@gwent/graphql-schema/database-typings'
import GameResolver from '../types/game-resolver'
import GameStore from '../../../database/stores/game-store'
import { getLogger } from 'log4js'
import { GraphQLResolveInfo } from 'graphql'
import MutationUtil from './mutation-util'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import { RequestedFields } from '@gwent/graphql-schema'

/**
 * A class for executing the playPass GraphQL Mutation.
 */
export default class PlayPassMutation {
  private static logger = getLogger('PlayPassMutation')

  static async playPass(args: MutationPlayPassArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const userId = context.session?.user?._id
    if (!userId) {
      PlayPassMutation.logger.error(`No user on context for playPass mutation: "${JSON.stringify(context.session)}".`)
      return Error(NOT_AUTHENTICATED_MESSAGE) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const logPrefix = `playPass by "${userId}"`
    if (PlayPassMutation.logger.isTraceEnabled()) {
      PlayPassMutation.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
      PlayPassMutation.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      PlayPassMutation.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }

    const gameId = args.game

    const response = await MutationUtil.getGamePlayer({
      gameId,
      logger: PlayPassMutation.logger,
      logPrefix,
      userId,
    })

    if (response instanceof Error) {
      return response as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const { game, player } = response

    const gameStatus = GameResolver.getStatus(game)
    if (gameStatus !== GameStatus.Playing) {
      const message = `Invalid game status "${gameStatus}": Can only pass for game with status "${GameStatus.Playing}".`
      PlayPassMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    // TODO: ensure it is users turn
    // TODO: ensure user has not already passed

    // pass
    const currentRound = player.rounds[game.round.current]
    player.rounds[game.round.current] = {
      ...currentRound,
      moves: [
        ...currentRound.moves,
        {
          created: new Date(),
          type: 'PASS', // TODO: make enum?
        },
      ],
      passed: true,
    }

    // set next player
    const nextPlayerId = MutationUtil.getNextPlayerId({
      currentPlayer: player,
      game,
      logger: PlayPassMutation.logger,
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

    return GameResolver.fromObject({
      game: updatedGame,
    })
  }
}
