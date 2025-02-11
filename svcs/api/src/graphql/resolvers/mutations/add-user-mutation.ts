import { getLogger } from 'log4js'

import { GraphQLResolveInfo } from 'graphql'
import { MutationAddUserArgs, User } from '@gwent/graphql-schema/resolver-typings'
import PresentableError from '../../../util/presentable-error'
import ResolverUtil from '../resolver-util'
import UserResolver from '../types/user-resolver'
import UserStore from '../../../database/stores/user-store'

/**
 * A class for executing the addUser GraphQL Mutation.
 */
export default class AddUserMutation {
  private static logger = getLogger('AddUserMutation')

  /**
   * Add a User.
   *
   * @param args The arguments for adding a user.
   * @param info The information about the GraphQL request.
   * @returns The User that was added.
   */
  static async addUser(args: MutationAddUserArgs, info: GraphQLResolveInfo): Promise<User> {
    const resolverUtil = new ResolverUtil({
      logger: AddUserMutation.logger,
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

    try {
      const user = await UserStore.add(name, password)
      if (AddUserMutation.logger.isTraceEnabled()) {
        AddUserMutation.logger.trace(`${logPrefix} user: "${JSON.stringify(user)}"`)
      }
      return UserResolver.fromObject(user)
    } catch (err: unknown) {
      const alreadyExistsMessage = `User with name "${name}" already exists.`
      if (err instanceof Error && err.message === alreadyExistsMessage) {
        AddUserMutation.logger.warn(`${logPrefix} failed: ${alreadyExistsMessage}`)
        throw new PresentableError(alreadyExistsMessage)
      }
      AddUserMutation.logger.error(Error(`${logPrefix} failed: ${err}`))
      throw err
    }
  }
}
