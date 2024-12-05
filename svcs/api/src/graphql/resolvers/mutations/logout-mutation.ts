import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { GraphQLResolveInfo } from 'graphql'
import { RequestedFields } from '@gwent/graphql-schema'

/**
 * A class executing the actions of the GraphQL Mutations defined in the schema.
 */
export default class LogoutMutation {
  private static logger = getLogger('logout-mutation')

  static logout(context: Context, info: GraphQLResolveInfo): boolean {
    const userId = context.session?.user?._id
    const logPrefix = `logout for user "${userId}"`
    if (LogoutMutation.logger.isTraceEnabled()) {
      LogoutMutation.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      LogoutMutation.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }
    if (userId) {
      LogoutMutation.logger.debug(`${logPrefix}: removing from session.`)
      if (context.session?.user) {
        delete context.session.user
      }
      return true
    }
    return false
  }
}
