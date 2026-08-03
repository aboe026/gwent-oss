import { getLogger } from 'log4js'

import { GraphQLResolveInfo } from 'graphql'
import { MutationAddUserArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import ResolverUtil from '../../resolver-util'

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
