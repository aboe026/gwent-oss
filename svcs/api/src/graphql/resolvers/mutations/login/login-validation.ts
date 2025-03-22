import { getLogger } from 'log4js'

import { GraphQLResolveInfo } from 'graphql'
import { MutationLoginArgs } from '@gwent/graphql-schema/resolver-typings'
import PresentableError from '../../../../util/presentable-error'
import ResolverUtil from '../../resolver-util'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserStore from '../../../../database/stores/user-store'

/**
 * A class for executing the login GraphQL Mutation.
 */
export default class LoginValidation {
  private static logger = getLogger('LoginValidation')

  /**
   * Authenticate a user session.
   *
   * @param args The arguments for logging in a user.
   * @param context The session to add the user to if valid.
   * @param info The information about the GraphQL request.
   * @returns The User that was successfully logged in.
   * @throws PresentableError if problem authenticating user.
   */
  static async loginValidation(
    args: MutationLoginArgs,
    info: GraphQLResolveInfo
  ): Promise<{
    logPrefix: string
    user: UserDbObject
  }> {
    const resolverUtil = new ResolverUtil({
      logger: LoginValidation.logger,
    })

    const name = args.name
    const password = args.password

    const logPrefix = `login for user "${name}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.logRequestInfo({
      args,
      info,
      secureKeys: ['password'],
    })

    let user: UserDbObject
    try {
      user = await UserStore.validate(name, password)
      if (LoginValidation.logger.isTraceEnabled()) {
        LoginValidation.logger.trace(`${logPrefix} user: "${JSON.stringify(user)}"`)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message === `Invalid credentials for user "${name}"`) {
        const message = `Invalid credentials for user "${name}".`
        LoginValidation.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
      LoginValidation.logger.error(Error(`${logPrefix} failed: ${err}`))
      throw err
    }

    return {
      logPrefix,
      user,
    }
  }
}
