import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import { UserResolvers } from '@gwent/graphql-schema/resolver-typings'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const UserResolver: UserResolvers<any, UserDbObject> = {
  id: (user: UserDbObject) => user._id.toString(),
}

export default UserResolver
