import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { GraphQLResolveInfo } from 'graphql'
import Permissions from '../../permissions'
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
   * @throws {PresentableError} if problem getting session user.
   */
  static currentUser(context: Context, info: GraphQLResolveInfo): User {
    const user = Permissions.isAuthenticated({
      context,
      label: 'currentUser query',
    })

    const logPrefix = `currentUser by "${user?._id}"`
    const resolverUtil = new ResolverUtil({
      logger: CurrentUserQuery.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      info,
    })

    return UserResolver.fromObject(user)
  }
}
