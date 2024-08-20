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

  static async resolveById(id: ObjectId | string): Promise<User> {
    return (await UserResolver.resolveByIds([id]))[0]
  }

  static async resolveByIds(ids: (ObjectId | string)[]): Promise<User[]> {
    const users = await UserStore.getByIds(ids)
    return users.map((user) => UserResolver.resolveByObject(user))
  }
}
