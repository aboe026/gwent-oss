import { getLogger } from 'log4js'

import { User } from '@gwent/graphql-schema/resolver-typings'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserResolver from '../../types/user-resolver'

/**
 * A class for resolving the login GraphQL Mutation.
 */
export default class LoginResolution {
  private static logger = getLogger('LoginResolution')

  /**
   * Resolve a newly logged in user, passing it back on the request.
   *
   * @param config The configuration used to resolve the new user.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @param config.user The user which has been successfully authenticated.
   * @returns The User that was successfully logged in with fields resolved.
   */
  static loginResolution({ logPrefix, user }: { logPrefix: string; user: UserDbObject }): User {
    const resolvedUser = UserResolver.fromObject(user)

    if (LoginResolution.logger.isTraceEnabled()) {
      LoginResolution.logger.trace(`${logPrefix} resolvedUser: "${JSON.stringify(resolvedUser)}"`)
    }

    return resolvedUser
  }
}
