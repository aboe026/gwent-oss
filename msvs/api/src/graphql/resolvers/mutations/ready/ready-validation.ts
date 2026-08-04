import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent-oss/graphql-schema/context'
import { GameDbObject, GameStatus } from '@gwent-oss/graphql-schema/database-typings'
import { GraphQLResolveInfo } from 'graphql'
import { MutationReadyArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import Permissions from '../../../permissions'
import ResolverUtil from '../../resolver-util'

/**
 * A class for validating the ready GraphQL Mutation.
 */
export default class ReadyValidation {
  private static logger = getLogger('ReadyValidation')

  /**
   * Validates the inputs for marking a game as ready.
   *
   * @param args The arguments for marking a game as ready.
   * @param context The session containing the user readying the game.
   * @param info The information about the GraphQL request.
   * @returns The information needed to mark the game as ready.
   */
  static async readyValidation(
    args: MutationReadyArgs,
    context: Context,
    info: GraphQLResolveInfo
  ): Promise<ValidatedReady> {
    const { _id: userId } = Permissions.isAuthenticated({
      context,
      label: 'ready mutation',
    })
    const { game } = await Permissions.isGamePlayer({
      gameId: args.game,
      label: 'ready mutation',
      userId,
    })

    const logPrefix = `ready by "${userId}" on game "${game._id}"`
    const resolverUtil = new ResolverUtil({
      logger: ReadyValidation.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    resolverUtil.validateGame({
      game,
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
