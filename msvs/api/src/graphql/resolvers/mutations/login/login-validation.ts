import { getLogger } from 'log4js'

import { GraphQLResolveInfo } from 'graphql'
import { MutationLoginArgs } from '@gwent/graphql-schema/resolver-typings'
import PresentableError from '../../../../util/presentable-error'
import ResolverUtil from '../../resolver-util'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserStore from '../../../../database/stores/user-store'

/**
 * A class for validating the login GraphQL Mutation.
 */
export default class LoginValidation {
  private static logger = getLogger('LoginValidation')

  /**
   * Validates the inputs for logging in a user.
   *
   * @param args The arguments for logging in a user.
   * @param info The information about the GraphQL request.
   * @returns The information needed to log in the user.
   * @throws {PresentableError} if known problem authenticating user.
   * @throws {unknown} if unforseen problem authenticating user.
   */
  static async loginValidation(
    args: MutationLoginArgs,
    info: GraphQLResolveInfo
  ): Promise<{
    logPrefix: string
    user: UserDbObject
  }> {
    const name = args.name
    const password = args.password

    const logPrefix = `login for user "${name}"`
    const resolverUtil = new ResolverUtil({
      logger: LoginValidation.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      args,
      info,
      secureKeys: ['password'],
    })

    let user: UserDbObject
    try {
      user = await UserStore.validate(name, password)
    } catch (err: unknown) {
      if (err instanceof Error && err.message === `Invalid credentials for user "${name}"`) {
        const message = `Invalid credentials for user "${name}".`
        LoginValidation.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
      LoginValidation.logger.error(`${logPrefix} failed: ${err}`)
      throw err
    }

    if (LoginValidation.logger.isTraceEnabled()) {
      LoginValidation.logger.trace(`${logPrefix} user: "${JSON.stringify(user)}"`)
    }

    return {
      logPrefix,
      user,
    }
  }
}
