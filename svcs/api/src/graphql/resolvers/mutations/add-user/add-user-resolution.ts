import { getLogger } from 'log4js'

import { User } from '@gwent/graphql-schema/resolver-typings'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserResolver from '../../types/user-resolver'

/**
 * A class for executing the addUser GraphQL Mutation.
 */
export default class AddUserResolution {
  private static logger = getLogger('AddUserResolution')

  /**
   * Add a User.
   *
   * @param args The arguments for adding a user.
   * @param info The information about the GraphQL request.
   * @returns The User that was added.
   * @throws PresentableError if problem adding user.
   */
  static async addUserResolution({ logPrefix, user }: { logPrefix: string; user: UserDbObject }): Promise<User> {
    const resolvedUser = await UserResolver.fromObject(user)

    if (AddUserResolution.logger.isTraceEnabled()) {
      AddUserResolution.logger.trace(`${logPrefix} resolvedUser: "${JSON.stringify(resolvedUser)}"`)
    }

    return resolvedUser
  }
}
