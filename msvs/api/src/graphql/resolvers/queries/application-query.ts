import { getLogger } from 'log4js'

import AppInfo from '../../../app-info'
import { Application } from '@gwent-oss/graphql-schema/resolver-typings'
import { Context } from '@gwent-oss/graphql-schema/context'
import { GraphQLResolveInfo } from 'graphql'
import ResolverUtil from '../resolver-util'
import { version } from '../../../../package.json'

/**
 * A class for executing the application GraphQL Query.
 */
export default class ApplicationQuery {
  private static logger = getLogger('ApplicationQuery')

  /**
   * Gets information about the running Application.
   *
   * @param context The session containing the user getting the application information.
   * @param info The information about the GraphQL request.
   * @returns The information about the running Application.
   */
  static async application(context: Context, info: GraphQLResolveInfo): Promise<Application> {
    const userId = context?.session?.user?._id

    const logPrefix = `application by "${userId}"`
    const resolverUtil = new ResolverUtil({
      logger: ApplicationQuery.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      info,
    })

    const build = await AppInfo.getBuildNumber()
    if (ApplicationQuery.logger.isTraceEnabled()) {
      ApplicationQuery.logger.trace(`${logPrefix} build: "${build}"`)
      ApplicationQuery.logger.trace(`${logPrefix} version: "${version}"`)
    }
    return {
      build,
      version,
    }
  }
}
