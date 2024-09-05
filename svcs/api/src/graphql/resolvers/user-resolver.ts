import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import { User } from '@gwent/graphql-schema/resolver-typings'
import { ObjectId } from 'mongodb'
import UserStore from '../../database/stores/user-store'

export default class UserResolver {
  static resolveByObject(user: UserDbObject): User {
    return {
      created: user.created,
      id: user._id.toString(),
      name: user.name,
    }
  }

  static async resolveById(id: ObjectId | string): Promise<User | undefined> {
    const users = await UserResolver.resolveByIds([id])
    // TODO: error if more than 1 returned
    if (users && users.length > 0) {
      return users[0]
    }
  }

  static async resolveByIds(ids: (ObjectId | string)[]): Promise<User[]> {
    const users = await UserStore.getByIds(ids)
    // TODO: ensure user returned for every id
    return users.map((user) => UserResolver.resolveByObject(user))
  }
}
