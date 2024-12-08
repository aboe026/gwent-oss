import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { Faction, QueryFactionsArgs } from '@gwent/graphql-schema/resolver-typings'
import FactionResolver from '../types/faction-resolver'
import FactionStore from '../../../database/stores/faction-store'
import { GraphQLResolveInfo } from 'graphql'
import { RequestedFields } from '@gwent/graphql-schema'

/**
 * A class for executing the factions GraphQL Query.
 */
export default class FactionsQuery {
  private static logger = getLogger('FactionsQuery')

  /**
   * Gets all Factions available.
   *
   * @param context The session containing the user getting the factions.
   * @param info The information about the GraphQL request.
   * @returns The Factions available.
   */
  static async factions(args: QueryFactionsArgs, context: Context, info: GraphQLResolveInfo): Promise<Faction[]> {
    const userId = context.session?.user?._id
    const logPrefix = `factions by "${userId}"`
    if (FactionsQuery.logger.isTraceEnabled()) {
      FactionsQuery.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      FactionsQuery.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }
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
