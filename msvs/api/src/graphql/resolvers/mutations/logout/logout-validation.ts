import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { GraphQLResolveInfo } from 'graphql'
import ResolverUtil from '../../resolver-util'

/**
 * A class for validating the logout GraphQL Mutation.
 */
export default class LogoutValidation {
  private static logger = getLogger('LogoutValidation')

  /**
   * Validates the inputs for removing a users session.
   *
   * @param context The session to remove the user from valid.
   * @param info The information about the GraphQL request.
   * @returns The information needed to remove the session for a user.
   */
  static logoutValidation(context: Context, info: GraphQLResolveInfo): ValidatedLogout {
    const userId = context?.session?.user?._id

    const logPrefix = `logout for user "${userId}"`
    const resolverUtil = new ResolverUtil({
      logger: LogoutValidation.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      info,
    })

    return {
      logPrefix,
      userId,
    }
  }
}

export interface ValidatedLogout {
  logPrefix: string
  userId?: ObjectId
}
