import { FindOptions, ObjectId } from 'mongodb'
import { getLogger } from 'log4js'

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
      user.password = '' // for security, ensure password isn't exposed
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
   * Retrieve a user from the database by their ObjectId.
   *
   * @param id The ObjectId of the user to retrieve.
   * @returns The User database object if it exists, undefined otherwise.
   * @throws Error if more than 1 user found.
   */
  static async getById(id: string | ObjectId): Promise<UserDbObject | undefined> {
    const users = await UserStore.getByIds([id])
    if (users.length > 1) {
      const message = `Multiple users with ID "${id}" found.`
      UserStore.logger.error(message)
      throw Error(message)
    }
    if (users.length === 1) {
      const user = users[0]
      user.password = '' // for security, ensure password isn't exposed
      return user
    }
  }

  /**
   * Retrieve users from the database by their ObjectIds.
   *
   * @param ids The ObjectIds of the users to retrieve.
   * @returns An array of database users found with the given IDs.
   */
  static async getByIds(ids: (string | ObjectId)[]): Promise<UserDbObject[]> {
    UserStore.logger.trace(`Getting users with IDs "${JSON.stringify(ids)}"`)
    const users = await UserStore.read<UserDbObject[]>({
      filter: {
        _id: {
          $in: ids.map((id) => new ObjectId(id)),
        },
      },
    })
    return users.map((user) => {
      user.password = '' // for security, ensure password isn't exposed
      return user
    })
  }

  /**
   * Retrieve users from the database by their names.
   *
   * @param names The names of the users to retrieve.
   * @returns An array of user database documents found with the given names.
   */
  static async getByNames(names: string[], options?: FindOptions<Document>): Promise<UserDbObject[]> {
    if (UserStore.logger.isTraceEnabled()) {
      UserStore.logger.trace(`Getting users with names "${JSON.stringify(names)}"`)
    }
    const response = await UserStore.read<UserDbObject[]>({
      filter: {
        name: {
          $in: names,
        },
      },
      options,
    })
    return response.map((user) => {
      user.password = '' // for security, ensure password isn't exposed
      return user
    })
  }

  /**
   * Checks if a user exists with the correct password.
   *
   * @param name The name of the user to check.
   * @param password The password to check against the potentially existing user.
   * @returns The User if they exist with the correct password.
   * @throws Error if the user does not exist, more than 1 user found with the name, or if the password is not correct.
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
    const passwordCorrect = await PasswordHasher.match(password, user.password)
    if (passwordCorrect) {
      user.password = '' // for security, ensure password isn't exposed
      return user
    }
    UserStore.logger.debug(`User "${name}" entered incorrect password`)
    throw Error(`Invalid credentials for user "${name}"`)
  }
}
