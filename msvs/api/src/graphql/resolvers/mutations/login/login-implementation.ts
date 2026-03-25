import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * A class for implementing the login GraphQL Mutation.
 */
export default class LoginImplementation {
  private static logger = getLogger('LoginImplementation')

  /**
   * Authenticate a user session, adding them to the context.
   *
   * @param config The configuration used to login the user.
   * @param config.context The GraphQL context on which to save the user to use for authentication and authorization on subsequent queries/mutations/subscriptions.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @param config.user The user to set on the context.
   * @returns The context updated with the user on it.
   */
  static loginImplementation({
    context,
    logPrefix,
    user,
  }: {
    context: Context
    logPrefix: string
    user: UserDbObject
  }): Context {
    if (context?.session?.user) {
      LoginImplementation.logger.trace(`${logPrefix} overwriting user on context session.`)
      context.session.user = user
    } else if (context?.session) {
      LoginImplementation.logger.trace(`${logPrefix} setting user on context session.`)
      context.session.user = user
    } else if (context) {
      LoginImplementation.logger.trace(`${logPrefix} session not set, defining.`)
      context.session = {
        user,
      }
    } else {
      LoginImplementation.logger.trace(`${logPrefix} context not set, defining.`)
      context = {
        session: {
          user,
        },
      }
    }
    return context
  }
}
