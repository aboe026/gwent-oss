import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { GraphQLResolveInfo } from 'graphql'
import { MutationLoginArgs, User } from '@gwent/graphql-schema/resolver-typings'
import { RequestedFields } from '@gwent/graphql-schema'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserResolver from '../types/user-resolver'
import UserStore from '../../../database/stores/user-store'

/**
 * A class for executing the login GraphQL Mutation.
 */
export default class LoginMutation {
  private static logger = getLogger('login-mutation')

  /**
   * Authenticate a user session.
   *
   * @param args The arguments for logging in a user.
   * @param context The session to add the user to if valid.
   * @param info The information about the GraphQL request.
   * @returns The User that was successfully logged in.
   */
  static async login(args: MutationLoginArgs, context: Context, info: GraphQLResolveInfo): Promise<User> {
    const name = args.name
    const password = args.password
    const logPrefix = `login for user "${name}"`
    if (LoginMutation.logger.isTraceEnabled()) {
      LoginMutation.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      LoginMutation.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }
    let user: UserDbObject
    try {
      user = await UserStore.validate(name, password)
      if (LoginMutation.logger.isTraceEnabled()) {
        LoginMutation.logger.trace(`${logPrefix} user: "${JSON.stringify(user)}"`)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message === `Invalid credentials for user "${name}"`) {
        const message = `Invalid credentials for user "${name}".`
        LoginMutation.logger.warn(`${logPrefix} failed: ${message}`)
        // return error so it won't get obfuscated by generic "Error!" if it were thrown instead
        return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      LoginMutation.logger.error(Error(`${logPrefix} failed: ${err}`))
      throw err
    }
    if (!context) {
      LoginMutation.logger.trace(`${logPrefix}: context not set, defining.`)
      context = {
        session: {
          user,
        },
      }
    } else if (!context.session) {
      LoginMutation.logger.trace(`${logPrefix}: session not set, defining.`)
      context.session = {
        user,
      }
    } else {
      LoginMutation.logger.trace(`${logPrefix}: setting user on context session.`)
      context.session.user = user
    }
    return UserResolver.fromObject(user)
  }
}
