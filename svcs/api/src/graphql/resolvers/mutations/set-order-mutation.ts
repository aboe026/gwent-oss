import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { Game, MutationSetOrderArgs } from '@gwent/graphql-schema/resolver-typings'
import { GraphQLResolveInfo } from 'graphql'
import MutationUtil from './mutation-util'
import ResolverUtil from '../resolver-util'

/**
 * A class for executing the setOrder GraphQL Mutation.
 */
export default class SetOrderMutation {
  private static logger = getLogger('SetOrderMutation')

  /**
   * Set the player turn order for a Game.
   *
   * @param args The arguments for setting the order of a game.
   * @param context The session containing the user setting the order.
   * @param info The information about the GraphQL request.
   * @returns The Game with player turn orders set.
   */
  static async setOrder(args: MutationSetOrderArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const resolverUtil = new ResolverUtil({
      logger: SetOrderMutation.logger,
    })
    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'setOrder mutation',
    })

    const logPrefix = `setOrder by "${userId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.printArgsAndInfo({
      args,
      info,
    })

    const gameId = args.game
    const userIds = args.users

    resolverUtil.verifyMongoIds({
      ids: [gameId],
      label: 'Game ID',
    })
    if (userIds) {
      resolverUtil.verifyMongoIds({
        ids: userIds,
        label: 'User ID',
      })
    }

    const mutationUtil = new MutationUtil({
      logger: SetOrderMutation.logger,
      logPrefix,
    })

    return mutationUtil.setGameTurnOrder({
      userId,
      gameId,
      userIds,
      allowImplicit: true,
    })
  }
}
