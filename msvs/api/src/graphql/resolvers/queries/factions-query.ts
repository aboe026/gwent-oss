import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { Faction, QueryFactionsArgs } from '@gwent/graphql-schema/resolver-typings'
import FactionResolver from '../types/faction-resolver'
import FactionStore from '../../../database/stores/faction-store'
import { GraphQLResolveInfo } from 'graphql'
import Permissions from '../../permissions'
import ResolverUtil from '../resolver-util'

/**
 * A class for executing the factions GraphQL Query.
 */
export default class FactionsQuery {
  private static logger = getLogger('FactionsQuery')

  /**
   * Gets all Factions available.
   *
   * @param args The arguments the user supplied to the query.
   * @param context The session containing the user getting the factions.
   * @param info The information about the GraphQL request.
   * @returns The Factions available.
   */
  static async factions(args: QueryFactionsArgs, context: Context, info: GraphQLResolveInfo): Promise<Faction[]> {
    const { _id: userId } = Permissions.isAuthenticated({
      context,
      label: 'factions query',
    })

    const logPrefix = `factions by "${userId}"`
    const resolverUtil = new ResolverUtil({
      logger: FactionsQuery.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    const keys = args.keys

    const factions = await FactionStore.get({
      keys: keys || undefined,
    })
    if (FactionsQuery.logger.isTraceEnabled()) {
      FactionsQuery.logger.trace(`${logPrefix} factions: "${JSON.stringify(factions)}"`)
    }
    return FactionResolver.fromArray({
      factions,
    })
  }
}
