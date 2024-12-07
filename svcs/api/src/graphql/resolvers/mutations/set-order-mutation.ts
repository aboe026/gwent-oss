import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { Game, MutationSetOrderArgs } from '@gwent/graphql-schema/resolver-typings'
import { GraphQLResolveInfo } from 'graphql'
import MutationUtil from './mutation-util'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import { RequestedFields } from '@gwent/graphql-schema'

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
    const userId = context.session?.user?._id
    if (!userId) {
      SetOrderMutation.logger.error(`No user on context for setOrder mutation: "${JSON.stringify(context.session)}".`)
      return Error(NOT_AUTHENTICATED_MESSAGE) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const logPrefix = `setOrder by "${userId}"`
    if (SetOrderMutation.logger.isTraceEnabled()) {
      SetOrderMutation.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
      SetOrderMutation.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      SetOrderMutation.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }

    return MutationUtil.setGameTurnOrder({
      userId,
      gameId: args.game,
      logPrefix,
      userIds: args.users,
      allowImplicit: true,
    })
  }
}
