import { getLogger } from 'log4js'

import { GraphQLResolveInfo } from 'graphql'
import { MutationAddUserArgs, User } from '@gwent/graphql-schema/resolver-typings'
import { RequestedFields } from '@gwent/graphql-schema'
import UserResolver from '../types/user-resolver'
import UserStore from '../../../database/stores/user-store'

/**
 * A class for executing the addUser GraphQL Mutation.
 */
export default class AddUserMutation {
  private static logger = getLogger('add-user-mutation')

  /**
   * Add a User.
   *
   * @param args The arguments for adding a user.
   * @param info The information about the GraphQL request.
   * @returns The User that was added.
   */
  static async addUser(args: MutationAddUserArgs, info: GraphQLResolveInfo): Promise<User> {
    const name = args.name
    const password = args.password
    const logPrefix = `addUser for user "${name}"`
    if (AddUserMutation.logger.isTraceEnabled()) {
      AddUserMutation.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      AddUserMutation.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }
    try {
      const user = await UserStore.add(name, password)
      if (AddUserMutation.logger.isTraceEnabled()) {
        AddUserMutation.logger.trace(`${logPrefix} user: "${JSON.stringify(user)}"`)
      }
      return UserResolver.fromObject(user)
    } catch (err: unknown) {
      const alreadyExistsMessage = `User with name "${name}" already exists.`
      if (err instanceof Error && err.message === alreadyExistsMessage) {
        AddUserMutation.logger.debug(`${logPrefix} failed: ${alreadyExistsMessage}`)
        // return error so it won't get obfuscated by generic "Error!" if it were thrown instead
        return Error(alreadyExistsMessage) as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      AddUserMutation.logger.error(Error(`${logPrefix} failed: ${err}`))
      throw err
    }
  }
}
