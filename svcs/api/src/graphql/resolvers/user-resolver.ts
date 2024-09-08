import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import { User } from '@gwent/graphql-schema/resolver-typings'
import { ObjectId } from 'mongodb'
import UserStore from '../../database/stores/user-store'
import verifyObjects from '../../util/verify-objects'
import { getLogger } from 'log4js'

export default class UserResolver {
  private static logger = getLogger('user-resolver')

  static resolveByObject(user: UserDbObject): User {
    return {
      created: user.created,
      id: user._id.toString(),
      name: user.name,
    }
  }

  static async resolveById(id: ObjectId | string): Promise<User> {
    const users = await UserResolver.resolveByIds([id])
    return users[0]
  }

  static async resolveByIds(ids: (ObjectId | string)[]): Promise<User[]> {
    const users = await UserStore.getByIds(ids)

    verifyObjects({
      expectedKeys: ids,
      objects: users,
      key: '_id',
      logger: UserResolver.logger,
      resourceLabelPlural: 'users',
    })

    return users.map((user) => UserResolver.resolveByObject(user))
  }
}
