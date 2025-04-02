import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * A class for executing the login GraphQL Mutation.
 */
export default class LoginImplementation {
  private static logger = getLogger('LoginImplementation')

  /**
   * Authenticate a user session.
   *
   * @param args The arguments for logging in a user.
   * @param context The session to add the user to if valid.
   * @param info The information about the GraphQL request.
   * @returns The User that was successfully logged in.
   * @throws PresentableError if problem authenticating user.
   */
  static loginImplementation({
    context,
    logPrefix,
    user,
  }: {
    context: Context
    logPrefix: string
    user: UserDbObject
  }) {
    if (context.session?.user) {
      LoginImplementation.logger.trace(`${logPrefix} overwriting user on context session.`)
      context.session.user = user
    } else if (context.session) {
      LoginImplementation.logger.trace(`${logPrefix} setting user on context session.`)
      context.session.user = user
    } else {
      LoginImplementation.logger.trace(`${logPrefix} session not set, defining.`)
      context.session = {
        user,
      }
    }
  }
}
