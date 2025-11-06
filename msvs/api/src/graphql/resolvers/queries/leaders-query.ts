import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { FactionDbObject } from '@gwent/graphql-schema/database-typings'
import FactionStore from '../../../database/stores/faction-store'
import { GraphQLResolveInfo } from 'graphql'
import { Leader, QueryLeadersArgs } from '@gwent/graphql-schema/resolver-typings'
import LeaderStore from '../../../database/stores/leader-store'
import LeaderResolver from '../types/leader-resolver'
import Permissions from '../../permissions'
import ResolverUtil from '../resolver-util'

/**
 * A class for executing the leaders GraphQL Query.
 */
export default class LeadersQuery {
  private static logger = getLogger('LeadersQuery')

  /**
   * Gets Leaders available to build Decks with.
   *
   * @param args The arguments the user supplied to the query.
   * @param context The session containing the user getting the leaders.
   * @param info The information about the GraphQL request.
   * @returns The Leaders available to build Decks with.
   */
  static async leaders(args: QueryLeadersArgs, context: Context, info: GraphQLResolveInfo): Promise<Leader[]> {
    const { _id: userId } = Permissions.isAuthenticated({
      context,
      label: 'leaders query',
    })

    const logPrefix = `leaders by "${userId}"`
    const resolverUtil = new ResolverUtil({
      logger: LeadersQuery.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    const factionKeys = args.factions

    let factionIds: string[] | undefined = undefined
    let factions: FactionDbObject[] | undefined
    if (factionKeys) {
      factions = await FactionStore.get({
        keys: factionKeys,
      })
      if (LeadersQuery.logger.isTraceEnabled()) {
        LeadersQuery.logger.trace(`${logPrefix} factions: "${JSON.stringify(factions)}"`)
      }
      factionIds = factions.map((faction) => faction._id.toString())
    }
    if (LeadersQuery.logger.isTraceEnabled()) {
      LeadersQuery.logger.trace(`${logPrefix} factionIds: "${JSON.stringify(factionIds)}"`)
    }
    const leaders = await LeaderStore.get({
      factionIds,
    })
    if (LeadersQuery.logger.isTraceEnabled()) {
      LeadersQuery.logger.trace(`${logPrefix} leaders: "${JSON.stringify(leaders)}"`)
    }
    return LeaderResolver.fromArray({
      leaders,
      factions,
    })
  }
}
