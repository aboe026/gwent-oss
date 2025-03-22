import { getLogger } from 'log4js'

import { GraphQLResolveInfo } from 'graphql'
import { MutationAddUserArgs } from '@gwent/graphql-schema/resolver-typings'
import ResolverUtil from '../../resolver-util'

/**
 * A class for executing the addUser GraphQL Mutation.
 */
export default class AddUserValidation {
  private static logger = getLogger('AddUserValidation')

  /**
   * Add a User.
   *
   * @param args The arguments for adding a user.
   * @param info The information about the GraphQL request.
   * @returns The User that was added.
   * @throws PresentableError if problem adding user.
   */
  static async addUserValidation(args: MutationAddUserArgs, info: GraphQLResolveInfo): Promise<ValidatedAddUser> {
    const resolverUtil = new ResolverUtil({
      logger: AddUserValidation.logger,
    })

    const name = args.name
    const password = args.password

    const logPrefix = `addUser for user "${name}"`
    resolverUtil.setLogPrefix(logPrefix)
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
