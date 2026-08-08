import { getLogger } from 'log4js'

import { GraphQLResolveInfo } from 'graphql'
import { MutationAddUserArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import PresentableError from '../../../../util/presentable-error'
import ResolverUtil from '../../resolver-util'
import { USERNAME_REQUIREMENTS } from '@gwent-oss/constants'
import { validateUsername } from '@gwent-oss/validators'

/**
 * A class for validating the addUser GraphQL Mutation.
 */
export default class AddUserValidation {
  private static logger = getLogger('AddUserValidation')

  /**
   * Validates the inputs for adding a new user.
   *
   * @param args The arguments for adding a user.
   * @param info The information about the GraphQL request.
   * @returns The information needed to add the user.
   */
  static async addUserValidation(args: MutationAddUserArgs, info: GraphQLResolveInfo): Promise<ValidatedAddUser> {
    const name = args.name
    const password = args.password

    const logPrefix = `addUser for user "${name}"`
    const resolverUtil = new ResolverUtil({
      logger: AddUserValidation.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      args,
      info,
      secureKeys: ['password'],
    })

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
      AddUserValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    return {
      logPrefix,
      name,
      password,
    }
  }
}

export interface ValidatedAddUser {
  logPrefix: string
  name: string
  password: string
}
