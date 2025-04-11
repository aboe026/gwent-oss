import { getLogger } from 'log4js'

import { User } from '@gwent/graphql-schema/resolver-typings'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserResolver from '../../types/user-resolver'

/**
 * A class for resolving the addUser GraphQL Mutation.
 */
export default class AddUserResolution {
  private static logger = getLogger('AddUserResolution')

  /**
   * Resolve a newly added user, passing it back on the request.
   *
   * @param config The configuration used to resolve the new user.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @param config.user The newly created user.
   * @returns The User that was added with fields resolved.
   */
  static addUserResolution({ logPrefix, user }: { logPrefix: string; user: UserDbObject }): User {
    const resolvedUser = UserResolver.fromObject(user)

    if (AddUserResolution.logger.isTraceEnabled()) {
      AddUserResolution.logger.trace(`${logPrefix} resolvedUser: "${JSON.stringify(resolvedUser)}"`)
    }

    return resolvedUser
  }
}
