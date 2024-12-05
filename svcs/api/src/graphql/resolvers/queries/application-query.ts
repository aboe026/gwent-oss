import { getLogger } from 'log4js'

import AppInfo from '../../../app-info'
import { Application } from '@gwent/graphql-schema/resolver-typings'
import { Context } from '@gwent/graphql-schema/context'
import { GraphQLResolveInfo } from 'graphql'
import { RequestedFields } from '@gwent/graphql-schema'
import { version } from '../../../../package.json'

/**
 * A class for executing the searches of the GraphQL Queries defined in the schema.
 */
export default class ApplicationQuery {
  private static logger = getLogger('application-query')

  static async application(context: Context, info: GraphQLResolveInfo): Promise<Application> {
    const userId = context.session?.user?._id
    const logPrefix = `application by "${userId}"`
    if (ApplicationQuery.logger.isTraceEnabled()) {
      ApplicationQuery.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      ApplicationQuery.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }
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
