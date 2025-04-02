import { getLogger } from 'log4js'

import { User } from '@gwent/graphql-schema/resolver-typings'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserResolver from '../../types/user-resolver'

/**
 * A class for executing the login GraphQL Mutation.
 */
export default class LoginResolution {
  private static logger = getLogger('LoginResolution')

  /**
   * Authenticate a user session.
   *
   * @param args The arguments for logging in a user.
   * @param context The session to add the user to if valid.
   * @param info The information about the GraphQL request.
   * @returns The User that was successfully logged in.
   * @throws PresentableError if problem authenticating user.
   */
  static loginResolution({ logPrefix, user }: { logPrefix: string; user: UserDbObject }): User {
    const resolvedUser = UserResolver.fromObject(user)

    if (LoginResolution.logger.isTraceEnabled()) {
      LoginResolution.logger.trace(`${logPrefix} resolvedUser: "${JSON.stringify(resolvedUser)}"`)
    }

    return resolvedUser
  }
}
