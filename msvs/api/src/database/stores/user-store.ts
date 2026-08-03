import { Document, Filter, FindOptions, ObjectId } from 'mongodb'
import { getLogger } from 'log4js'

import PasswordHasher from '../../util/password-hasher'
import Store from './store'
import { UserDbObject } from '@gwent-oss/graphql-schema/database-typings'

/**
 * Factory for users that can interact with the application.
 */
export default class UserStore extends Store {
  static readonly COLLECTION_NAME = 'users'
  private static logger = getLogger('UserStore')

  /**
   * Add a User to the database.
   *
   * @param name The name of the user to add.
   * @param password The password of the user to add.
   * @returns The User database object with password omitted.
   * @throws {Error} if a User with the name already exists.
   * @throws {unknown} if unforseen problem adding the user.
   */
  static async add(name: string, password: string): Promise<UserDbObject> {
    UserStore.logger.debug(`Adding user with name "${name}"`)
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
        const message = `User with name "${name}" already exists.`
        UserStore.logger.warn(message)
        throw Error(message, {
          cause: err,
        })
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
   * @throws {Error} if more than 1 user found.
   */
  static async getById(id: string | ObjectId): Promise<UserDbObject | undefined> {
    UserStore.logger.debug(`Getting user by id "${id}"`)
    const users = await UserStore.getByIds([id])
    if (users.length > 1) {
      const message = `Multiple users with ID "${id}" found`
      UserStore.logger.error(
        `${message}: "${JSON.stringify(
          users.map((user) => {
            return {
              ...user,
              password: '',
            }
          })
        )}"`
      )
      throw Error(`${message}.`)
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
    if (UserStore.logger.isDebugEnabled()) {
      UserStore.logger.debug(`Getting users with IDs "${JSON.stringify(ids)}"`)
    }
    const filter: Filter<Document> = {
      _id: {
        $in: ids.map((id) => new ObjectId(id)),
      },
    }
    if (UserStore.logger.isTraceEnabled()) {
      UserStore.logger.trace(`getByIds filter: "${JSON.stringify(filter)}`)
    }
    const users = await UserStore.read<UserDbObject[]>({
      filter,
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
   * @param options The options used when retrieving the Users.
   * @returns An array of user database documents found with the given names.
   */
  static async getByNames(names: string[], options?: FindOptions): Promise<UserDbObject[]> {
    if (UserStore.logger.isDebugEnabled()) {
      UserStore.logger.debug(`Getting users with names "${JSON.stringify(names)}"`)
    }
    const filter: Filter<Document> = {
      name: {
        $in: names,
      },
    }
    if (UserStore.logger.isTraceEnabled()) {
      UserStore.logger.trace(`getByNames filter: "${JSON.stringify(filter)}`)
      UserStore.logger.trace(`getByNames options: "${JSON.stringify(options)}`)
    }
    const response = await UserStore.read<UserDbObject[]>({
      filter,
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
   * @throws {Error} if the user does not exist, more than 1 user found with the name, or if the password is not correct.
   */
  static async validate(name: string, password: string): Promise<UserDbObject> {
    UserStore.logger.debug(`Validating user with name "${name}"`)
    const filter: Filter<Document> = {
      name,
    }
    if (UserStore.logger.isTraceEnabled()) {
      UserStore.logger.trace(`validate filter: "${JSON.stringify(filter)}`)
    }
    const users = await UserStore.read<UserDbObject[]>({
      filter,
    })
    if (users.length === 0) {
      UserStore.logger.warn(`User with name "${name}" does not exist.`)
      throw Error(`Invalid credentials for user "${name}"`)
    } else if (users.length > 1) {
      const message = `More than 1 user exists with name "${name}"`
      UserStore.logger.error(`${message}: "${JSON.stringify(users)}"`)
      throw Error(`${message}.`)
    }
    const user = users[0]
    const passwordCorrect = await PasswordHasher.match(password, user.password)
    if (passwordCorrect) {
      user.password = '' // for security, ensure password isn't exposed
      return user
    }
    UserStore.logger.warn(`User "${name}" entered incorrect password.`)
    throw Error(`Invalid credentials for user "${name}"`)
  }
}
