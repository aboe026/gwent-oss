import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { FactionDbObject } from '@gwent/graphql-schema/database-typings'
import FactionStore from '../../../database/stores/faction-store'
import { GraphQLResolveInfo } from 'graphql'
import { QueryUnitsArgs, Unit } from '@gwent/graphql-schema/resolver-typings'
import { RequestedFields } from '@gwent/graphql-schema'
import UnitResolver from '../types/unit-resolver'
import UnitStore from '../../../database/stores/unit-store'

/**
 * A class for executing the units GraphQL Query.
 */
export default class UnitsQuery {
  private static logger = getLogger('UnitsQuery')

  /**
   * Gets all Units a user can build a Deck with.
   *
   * @param context The session containing the user getting the units.
   * @param info The information about the GraphQL request.
   * @returns The Units a user can build a Deck with.
   */
  static async units(args: QueryUnitsArgs, context: Context, info: GraphQLResolveInfo): Promise<Unit[]> {
    const userId = context.session?.user?._id
    const logPrefix = `units by "${userId}"`
    if (UnitsQuery.logger.isTraceEnabled()) {
      UnitsQuery.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
      UnitsQuery.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      UnitsQuery.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }
    const factionKeys = args.factions
    const deckable = args.deckable
    let factionIds: string[] | undefined = undefined
    let factions: FactionDbObject[] | undefined
    if (factionKeys) {
      factions = await FactionStore.get({
        keys: factionKeys,
      })
      if (UnitsQuery.logger.isTraceEnabled()) {
        UnitsQuery.logger.trace(`${logPrefix} factions: "${JSON.stringify(factions)}"`)
      }
      factionIds = factions.map((faction) => faction._id.toString())
    }
    if (UnitsQuery.logger.isTraceEnabled()) {
      UnitsQuery.logger.trace(`${logPrefix} factionIds: "${JSON.stringify(factionIds)}"`)
    }
    const units = await UnitStore.get({
      deckable: typeof deckable === 'boolean' ? deckable : undefined,
      factionIds,
    })
    if (UnitsQuery.logger.isTraceEnabled()) {
      UnitsQuery.logger.trace(`${logPrefix} units: "${JSON.stringify(units)}"`)
    }
    return UnitResolver.fromArray({
      factions,
      units,
    })
  }
}
