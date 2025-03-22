import { Context } from '@gwent/graphql-schema/context'
import { GraphQLResolveInfo } from 'graphql'
import LoginImplementation from './login-implementation'
import LoginValidation from './login-validation'
import { MutationLoginArgs, User } from '@gwent/graphql-schema/resolver-typings'
import UserResolver from '../../types/user-resolver'

/**
 * A class for executing the login GraphQL Mutation.
 */
export default class LoginMutation {
  /**
   * Authenticate a user session.
   *
   * @param args The arguments for logging in a user.
   * @param context The session to add the user to if valid.
   * @param info The information about the GraphQL request.
   * @returns The User that was successfully logged in.
   * @throws PresentableError if problem authenticating user.
   */
  static async loginMutation(args: MutationLoginArgs, context: Context, info: GraphQLResolveInfo): Promise<User> {
    const {
      logPrefix,
      user, //
    } = await LoginValidation.loginValidation(args, info)

    LoginImplementation.loginImplementation({
      context,
      logPrefix,
      user,
    })

    return UserResolver.fromObject(user)
  }
}
