import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import { User } from '@gwent/graphql-schema/resolver-typings'
import { ObjectId } from 'mongodb'
import UserStore from '../../database/stores/user-store'
import { getLogger } from 'log4js'
import Verifier from '../../util/verifier'

export default class UserResolver {
  private static logger = getLogger('user-resolver')

  static fromObject(user: UserDbObject): User {
    return {
      created: user.created,
      id: user._id.toString(),
      name: user.name,
    }
  }

  static async fromId(id: ObjectId | string): Promise<User> {
    const users = await UserResolver.fromIds([id])
    return users[0]
  }

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
