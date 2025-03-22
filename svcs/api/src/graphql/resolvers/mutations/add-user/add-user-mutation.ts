import AddUserImplementation from './add-user-implementation'
import AddUserValidation from './add-user-validation'
import { GraphQLResolveInfo } from 'graphql'
import { MutationAddUserArgs, User } from '@gwent/graphql-schema/resolver-typings'
import UserResolver from '../../types/user-resolver'

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
   * @throws PresentableError if problem adding user.
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

    return UserResolver.fromObject(user)
  }
}
