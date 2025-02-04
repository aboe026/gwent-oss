import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import env from '../../../env'
import { GraphQLResolveInfo } from 'graphql'
import ResolverUtil from '../resolver-util'
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
    const resolverUtil = new ResolverUtil({
      logger: SettingsQuery.logger,
    })
    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'settings query',
    })

    const logPrefix = `settings by "${userId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.printArgsAndInfo({
      info,
    })

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
