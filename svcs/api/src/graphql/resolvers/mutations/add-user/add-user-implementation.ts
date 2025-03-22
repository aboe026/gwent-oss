import { getLogger } from 'log4js'

import PresentableError from '../../../../util/presentable-error'
import UserStore from '../../../../database/stores/user-store'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import { ValidatedAddUser } from './add-user-validation'

/**
 * A class for executing the addUser GraphQL Mutation.
 */
export default class AddUserImplementation {
  private static logger = getLogger('AddUserImplementation')

  /**
   * Add a User.
   *
   * @param args The arguments for adding a user.
   * @param info The information about the GraphQL request.
   * @returns The User that was added.
   * @throws PresentableError if problem adding user.
   */
  static async addUserImplementation({ logPrefix, name, password }: ValidatedAddUser): Promise<UserDbObject> {
    let user: UserDbObject
    try {
      user = await UserStore.add(name, password)
      if (AddUserImplementation.logger.isTraceEnabled()) {
        AddUserImplementation.logger.trace(`${logPrefix} user: "${JSON.stringify(user)}"`)
      }
    } catch (err: unknown) {
      const alreadyExistsMessage = `User with name "${name}" already exists.`
      if (err instanceof Error && err.message === alreadyExistsMessage) {
        AddUserImplementation.logger.warn(`${logPrefix} failed: ${alreadyExistsMessage}`)
        throw new PresentableError(alreadyExistsMessage)
      }
      AddUserImplementation.logger.error(Error(`${logPrefix} failed: ${err}`))
      throw err
    }

    return user
  }
}
