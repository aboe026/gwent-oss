import { getLogger } from 'log4js'

import PresentableError from '../../../../util/presentable-error'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserStore from '../../../../database/stores/user-store'
import { ValidatedAddUser } from './add-user-validation'

/**
 * A class for implementing the addUser GraphQL Mutation.
 */
export default class AddUserImplementation {
  private static logger = getLogger('AddUserImplementation')

  /**
   * Add a User, saving them to the database.
   *
   * @param config The configuration used to add the user.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @param config.name The name of the user being created.
   * @param config.password The password of the user being creating.
   * @returns The User that was added.
   * @throws PresentableError if user with the name already exists.
   * @throws Error if unforseen problem adding the user.
   */
  static async addUserImplementation({ logPrefix, name, password }: ValidatedAddUser): Promise<UserDbObject> {
    let user: UserDbObject
    try {
      user = await UserStore.add(name, password)
    } catch (err: unknown) {
      const alreadyExistsMessage = `User with name "${name}" already exists.`
      if (err instanceof Error && err.message === alreadyExistsMessage) {
        AddUserImplementation.logger.warn(`${logPrefix} failed: ${alreadyExistsMessage}`)
        throw new PresentableError(alreadyExistsMessage)
      }
      AddUserImplementation.logger.error(`${logPrefix} failed: ${err}`)
      throw err
    }

    if (AddUserImplementation.logger.isTraceEnabled()) {
      AddUserImplementation.logger.trace(`${logPrefix} user: "${JSON.stringify(user)}"`)
    }

    return user
  }
}
