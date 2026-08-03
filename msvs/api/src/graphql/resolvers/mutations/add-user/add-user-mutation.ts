import AddUserImplementation from './add-user-implementation'
import AddUserResolution from './add-user-resolution'
import AddUserValidation from './add-user-validation'
import { GraphQLResolveInfo } from 'graphql'
import { MutationAddUserArgs, User } from '@gwent-oss/graphql-schema/resolver-typings'

/**
 * A class for executing the addUser GraphQL Mutation.
 */
export default class AddUserMutation {
  /**
   * Add a User.
   *
   * @param args The arguments for adding a user.
   * @param info The information about the GraphQL request.
   * @returns The User that was added.
   */
  static async addUserMutation(args: MutationAddUserArgs, info: GraphQLResolveInfo): Promise<User> {
    const {
      logPrefix,
      name,
      password, //
    } = await AddUserValidation.addUserValidation(args, info)

    const user = await AddUserImplementation.addUserImplementation({
      logPrefix,
      name,
      password,
    })

    return AddUserResolution.addUserResolution({
      logPrefix,
      user,
    })
  }
}
