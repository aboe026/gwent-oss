import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'

/**
 * A class for executing the logout GraphQL Mutation.
 */
export default class LogoutImplementation {
  private static logger = getLogger('LogoutImplementation')

  /**
   * Remove a user's session.
   *
   * @param args The arguments for logging out a user.
   * @param context The session to remove the user from valid.
   * @param info The information about the GraphQL request.
   * @returns True if the user was successfully removed from the session, false otherwise.
   */
  static logoutImplementation({
    context,
    logPrefix,
    userId,
  }: {
    context: Context
    logPrefix: string
    userId?: ObjectId
  }): boolean {
    if (userId) {
      LogoutImplementation.logger.debug(`${logPrefix} removing from session.`)
      if (context.session?.user) {
        delete context.session.user
      }
      return true
    }
    return false
  }
}
