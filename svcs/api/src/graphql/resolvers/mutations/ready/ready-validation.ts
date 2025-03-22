import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import { GraphQLResolveInfo } from 'graphql'
import { MutationReadyArgs } from '@gwent/graphql-schema/resolver-typings'
import ResolverUtil from '../../resolver-util'

/**
 * A class for executing the ready GraphQL Mutation.
 */
export default class ReadyValidation {
  private static logger = getLogger('ReadyValidation')

  /**
   * Mark a Game as ready for a User. Prevents redrawing units after marked as ready.
   *
   * @param args The arguments for marking a game as ready.
   * @param context The session containing the user readying the game.
   * @param info The information about the GraphQL request.
   * @returns The Game that is now ready for the user.
   * @throws PresentableError if problem marking game as ready.
   */
  static async readyValidation(
    args: MutationReadyArgs,
    context: Context,
    info: GraphQLResolveInfo
  ): Promise<ValidatedReady> {
    const resolverUtil = new ResolverUtil({
      logger: ReadyValidation.logger,
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

    const { game } = await resolverUtil.getGamePlayer({
      gameId,
      userId,
      status: GameStatus.Redrawing,
      label: 'mark ready',
    })

    return {
      logPrefix,
      game,
      userId,
    }
  }
}

export interface ValidatedReady {
  logPrefix: string
  game: GameDbObject
  userId: ObjectId
}
