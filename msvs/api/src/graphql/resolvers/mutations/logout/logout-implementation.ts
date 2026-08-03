import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent-oss/graphql-schema/context'

/**
 * A class for implementing the logout GraphQL Mutation.
 */
export default class LogoutImplementation {
  private static logger = getLogger('LogoutImplementation')

  /**
   * Remove a user's session from the GraphQL context so they are not longer authenticated.
   *
   * @param config The configuration used to logout the user.
   * @param config.context The GraphQL context to remove the user from.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @param config.userId The ID of the user to log out.
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
