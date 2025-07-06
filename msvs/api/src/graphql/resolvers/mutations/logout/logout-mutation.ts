import { Context } from '@gwent/graphql-schema/context'
import { GraphQLResolveInfo } from 'graphql'
import LogoutImplementation from './logout-implementation'
import LogoutValidation from './logout-validation'

/**
 * A class for executing the logout GraphQL Mutation.
 */
export default class LogoutMutation {
  /**
   * Remove a user's session.
   *
   * @param context The session to remove the user from valid.
   * @param info The information about the GraphQL request.
   * @returns True if the user was successfully removed from the session, false otherwise.
   */
  static logoutMutation(context: Context, info: GraphQLResolveInfo): boolean {
    const {
      logPrefix,
      userId, //
    } = LogoutValidation.logoutValidation(context, info)

    return LogoutImplementation.logoutImplementation({
      context,
      logPrefix,
      userId,
    })
  }
}
