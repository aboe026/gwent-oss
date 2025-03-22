import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { GraphQLResolveInfo } from 'graphql'
import LogoutImplementation from './logoutImplementation'
import LogoutValidation from './logout-validation'

/**
 * A class for executing the logout GraphQL Mutation.
 */
export default class LogoutMutation {
  private static logger = getLogger('LogoutMutation')

  /**
   * Remove a user's session.
   *
   * @param args The arguments for logging out a user.
   * @param context The session to remove the user from valid.
   * @param info The information about the GraphQL request.
   * @returns True if the user was successfully removed from the session, false otherwise.
   */
  static logoutMutation(context: Context, info: GraphQLResolveInfo): boolean {
    const {
      logPrefix,
      userId, //
    } = LogoutValidation.logoutValidation(context, info)

    const loggedOut = LogoutImplementation.logoutImplementation({
      context,
      logPrefix,
      userId,
    })

    return loggedOut
  }
}
