import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { GraphQLResolveInfo } from 'graphql'
import { RequestedFields } from '@gwent/graphql-schema'
import { User } from '@gwent/graphql-schema/resolver-typings'
import UserResolver from '../types/user-resolver'

/**
 * A class for executing the searches of the GraphQL Queries defined in the schema.
 */
export default class CurrentUserQuery {
  private static logger = getLogger('current-user-query')

  static currentUser(context: Context, info: GraphQLResolveInfo): User {
    const user = context.session?.user
    const logPrefix = `currentUser by "${user?._id}"`
    if (CurrentUserQuery.logger.isTraceEnabled()) {
      CurrentUserQuery.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      CurrentUserQuery.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
      CurrentUserQuery.logger.trace(`${logPrefix} user: "${JSON.stringify(user)}"`)
    }
    if (!user) {
      const message = 'No user on session.'
      CurrentUserQuery.logger.debug(`${logPrefix} failed: "${message}"`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    return UserResolver.fromObject(user)
  }
}
