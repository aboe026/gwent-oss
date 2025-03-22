import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { GraphQLResolveInfo } from 'graphql'
import ResolverUtil from '../../resolver-util'

/**
 * A class for executing the logout GraphQL Mutation.
 */
export default class LogoutValidation {
  private static logger = getLogger('LogoutValidation')

  /**
   * Remove a user's session.
   *
   * @param args The arguments for logging out a user.
   * @param context The session to remove the user from valid.
   * @param info The information about the GraphQL request.
   * @returns True if the user was successfully removed from the session, false otherwise.
   */
  static logoutValidation(context: Context, info: GraphQLResolveInfo): ValidatedLogout {
    const resolverUtil = new ResolverUtil({
      logger: LogoutValidation.logger,
    })
    const userId = context.session?.user?._id

    const logPrefix = `logout for user "${userId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.logRequestInfo({
      info,
    })

    return {
      logPrefix,
      userId,
    }
  }
}

interface ValidatedLogout {
  logPrefix: string
  userId?: ObjectId
}
