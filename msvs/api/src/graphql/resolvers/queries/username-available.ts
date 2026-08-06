import { getLogger } from 'log4js'

import { Context } from '@gwent-oss/graphql-schema/context'
import { GraphQLResolveInfo } from 'graphql'
import { QueryUsernameAvailableArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import ResolverUtil from '../resolver-util'
import UserStore from '../../../database/stores/user-store'

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

    // TODO: validate username requirements
    const existingUser = await UserStore.getByName(args.name, {
      projection: {
        _id: 1,
      },
    })
    return existingUser === null
  }
}
