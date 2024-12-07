import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import env from '../../../env'
import { GraphQLResolveInfo } from 'graphql'
import { RequestedFields } from '@gwent/graphql-schema'
import { Setting, SettingKey, SettingType } from '@gwent/graphql-schema/resolver-typings'

/**
 * A class for executing the settings GraphQL Query.
 */
export default class SettingsQuery {
  private static logger = getLogger('SettingsQuery')

  /**
   * Gets the settings configured for the application.
   *
   * @param context The session containing the user getting the settings.
   * @param info The information about the GraphQL request.
   * @returns The settings configured for the application.
   */
  static settings(context: Context, info: GraphQLResolveInfo): Setting[] {
    const userId = context.session?.user?._id
    const logPrefix = `settings by "${userId}"`
    if (SettingsQuery.logger.isTraceEnabled()) {
      SettingsQuery.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      SettingsQuery.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }
    return [
      {
        key: SettingKey.SessionTimeoutSeconds,
        type: SettingType.Number,
        label: 'Session Timeout (seconds)',
        value: env().SESSION_TIMEOUT_SECONDS.toString(),
      },
    ]
  }
}
