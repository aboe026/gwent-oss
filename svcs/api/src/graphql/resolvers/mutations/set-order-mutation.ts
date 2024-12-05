import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { Game, MutationSetOrderArgs } from '@gwent/graphql-schema/resolver-typings'
import { GraphQLResolveInfo } from 'graphql'
import MutationUtil from './mutation-util'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import { RequestedFields } from '@gwent/graphql-schema'

/**
 * A class executing the actions of the GraphQL Mutations defined in the schema.
 */
export default class SetOrderMutation {
  private static logger = getLogger('set-order-mutation')

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
