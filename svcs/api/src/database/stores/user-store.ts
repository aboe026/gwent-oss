import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import PasswordHasher from '../../util/password-hasher'
import Store from './store'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * Factory for users that can interact with the application.
 */
export default class UserStore extends Store {
  static readonly COLLECTION_NAME = 'users'
  private static logger = getLogger('user-store')

  /**
   * Add a User to the database.
   *
   * @param name The name of the user to add.
   * @param password The password of the user to add.
   * @returns The User database object with password omitted.
   * @throws An Error if a User with the name already exists.
   */
  static async add(name: string, password: string): Promise<UserDbObject> {
    UserStore.logger.trace(`Adding user "${name}"`)
    try {
      const user = await UserStore.create<UserDbObject>({
        name,
        password: await PasswordHasher.hash(password),
        created: new Date(),
      })
      delete (user as any).password // eslint-disable-line @typescript-eslint/no-explicit-any
      return user
    } catch (err: unknown) {
      if (
        UserStore.isMongoError({
          error: err,
          code: 11000,
        })
      ) {
        const message = `User "${name}" already exists`
        UserStore.logger.error(message)
        throw Error(message)
      } else {
        UserStore.logger.error(err)
        throw err
      }
    }
  }

  /**
   * Retrieve a user from the database.
   *
   * @param id The ObjectId of the user to retrieve.
   * @returns The User database object.
   * @throws Error if the user with given ID does not exist
   */
  static async get(id: string | ObjectId): Promise<UserDbObject> {
    UserStore.logger.trace(`Getting user with ID "${id}"`)
    const response = await UserStore.read<UserDbObject[]>({
      filter: {
        _id: new ObjectId(id),
      },
    })
    if (!response || response.length === 0) {
      const message = `User with ID "${id}" does not exist`
      UserStore.logger.error(message)
      throw Error(message)
    }
    return response[0]
  }

  /**
   * Checks if a user exists with the correct password.
   *
   * @param name The name of the user to check.
   * @param password The password to check against the potentially existing user.
   * @returns The User if they exist with the correct password.
   * @throws An Error if the user does not exist or if the password is not correct.
   */
  static async validate(name: string, password: string): Promise<UserDbObject> {
    const users = await UserStore.read<UserDbObject[]>({
      filter: {
        name,
      },
    })
    if (users.length === 0) {
      UserStore.logger.debug(`User "${name}" does not exist`)
      throw Error(`Invalid credentials for user "${name}"`)
    } else if (users.length > 1) {
      const message = `More than 1 user exists with name "${name}": "${JSON.stringify(users)}"`
      UserStore.logger.error(message)
      throw Error(message)
    }
    const user = users[0]
    const passwordCorrect = await PasswordHasher.match(password, (user as any).password) // eslint-disable-line @typescript-eslint/no-explicit-any
    if (passwordCorrect) {
      delete (user as any).password // eslint-disable-line @typescript-eslint/no-explicit-any
      return user
    }
    UserStore.logger.debug(`User "${name}" entered incorrect password`)
    throw Error(`Invalid credentials for user "${name}"`)
  }
}
