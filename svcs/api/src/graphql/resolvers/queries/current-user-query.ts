import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { GraphQLResolveInfo } from 'graphql'
import PresentableError from '../../../util/presentable-error'
import ResolverUtil from '../resolver-util'
import { User } from '@gwent/graphql-schema/resolver-typings'
import UserResolver from '../types/user-resolver'

/**
 * A class for executing the currentUser GraphQL Query.
 */
export default class CurrentUserQuery {
  private static logger = getLogger('CurrentUserQuery')

  /**
   * Gets the user on the session, if authenticated.
   *
   * @param context The session containing the user to retrieve.
   * @param info The information about the GraphQL request.
   * @returns The authenticated User.
   */
  static currentUser(context: Context, info: GraphQLResolveInfo): User {
    const resolverUtil = new ResolverUtil({
      logger: CurrentUserQuery.logger,
    })
    const user = context.session?.user

    const logPrefix = `currentUser by "${user?._id}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.printArgsAndInfo({
      info,
    })

    if (!user) {
      const message = 'No user on session.'
      CurrentUserQuery.logger.warn(`${logPrefix} failed: "${message}"`)
      throw new PresentableError(message)
    }
    return UserResolver.fromObject(user)
  }
}
