import { getLogger } from 'log4js'

import { Context } from '@gwent-oss/graphql-schema/context'
import { GraphQLResolveInfo } from 'graphql'
import { QueryUsernameAvailableArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import PresentableError from '../../../util/presentable-error'
import ResolverUtil from '../resolver-util'
import { USERNAME_REQUIREMENTS } from '@gwent-oss/constants'
import UserStore from '../../../database/stores/user-store'
import { validateUsername } from '@gwent-oss/validators'

/**
 * A class for executing the usernameAvailable GraphQL Query.
 */
export default class UsernameAvailableQuery {
  private static logger = getLogger('UsernameAvailableQuery')

  /**
   * Checks whether or not a username is available to use or not.
   *
   * @param args The arguments the user supplied to the query.
   * @param context The session containing the user getting the settings.
   * @param info The information about the GraphQL request.
   * @returns True if the username has not been taken yet, false otherwise.
   */
  static async usernameAvailable(
    args: QueryUsernameAvailableArgs,
    context: Context,
    info: GraphQLResolveInfo
  ): Promise<boolean> {
    const logPrefix = `usernameAvailable by "${context.session?.user?._id}"`
    const resolverUtil = new ResolverUtil({
      logger: UsernameAvailableQuery.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      info,
    })
    const name = args.name

    const usernameValidation = validateUsername(name)

    if (!usernameValidation.valid) {
      const violations: string[] = []
      if (usernameValidation.tooShort) {
        violations.push(`Length "${name.length}" less than minimum length "${USERNAME_REQUIREMENTS.Min}"`)
      }
      if (usernameValidation.tooLong) {
        violations.push(`Length "${name.length}" greater than maximum length "${USERNAME_REQUIREMENTS.Max}"`)
      }
      if (usernameValidation.spaces) {
        violations.push('Cannot contain spaces')
      }
      if (usernameValidation.badSpecials.size > 0) {
        violations.push(`Contains invalid characters "${[...usernameValidation.badSpecials].join('')}"`)
      }
      const message = `Invalid name "${name}": ${violations.join(' and ')}`
      UsernameAvailableQuery.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    const existingUser = await UserStore.getByName(name, {
      projection: {
        _id: 1,
      },
    })
    return existingUser === null
  }
}
