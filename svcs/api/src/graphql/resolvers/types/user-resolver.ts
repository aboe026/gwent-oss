import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { User } from '@gwent/graphql-schema/resolver-typings'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserStore from '../../../database/stores/user-store'
import Verifier from '../../../util/verifier'

/**
 * A class to convert User database objects to their GraphQL equivalent.
 */
export default class UserResolver {
  private static logger = getLogger('user-resolver')

  /**
   * Converts a single User database object to a single User GraphQL object.
   *
   * @param user The User database object to convert.
   * @returns The resolved User object matching its GraphQL schema definition.
   */
  static fromObject(user: UserDbObject): User {
    return {
      created: user.created,
      id: user._id.toString(),
      name: user.name,
    }
  }

  /**
   * Retrieves a User with the given ID and converts it to the GraphQL object equivalent.
   *
   * @param id The ObjectID of the User to convert.
   * @returns The resolved User object with the given ID.
   * @throws Error if a User with the given ID does not exist.
   */
  static async fromId(id: ObjectId | string): Promise<User> {
    const users = await UserResolver.fromIds([id])
    return users[0]
  }

  /**
   * Retrieves Users with the given IDs and converts them to their GraphQL object equivalents.
   *
   * @param ids The ObjectIDs of the Users to convert.
   * @returns The resolved Users array for the given IDs.
   * @throws Error if a User with the given IDs does not exist.
   */
  static async fromIds(ids: (ObjectId | string)[]): Promise<User[]> {
    if (ids.length === 0) {
      return []
    }

    const users = await UserStore.getByIds(ids)

    Verifier.checkObjects({
      expectedKeys: ids,
      objects: users,
      field: '_id',
      logger: UserResolver.logger,
      label: 'users',
    })

    return users.map((user) => UserResolver.fromObject(user))
  }
}
