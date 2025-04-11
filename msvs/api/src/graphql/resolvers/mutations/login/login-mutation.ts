import { Context } from '@gwent/graphql-schema/context'
import { GraphQLResolveInfo } from 'graphql'
import LoginImplementation from './login-implementation'
import LoginResolution from './login-resolution'
import LoginValidation from './login-validation'
import { MutationLoginArgs, User } from '@gwent/graphql-schema/resolver-typings'

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

    return LoginResolution.loginResolution({
      logPrefix,
      user,
    })
  }
}
