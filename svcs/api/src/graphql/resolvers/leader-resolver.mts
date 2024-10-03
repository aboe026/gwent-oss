import log4js from 'log4js'
import { ObjectId } from 'mongodb'

import { Dlc, Faction, Leader } from '@gwent/graphql-schema/resolver-typings'
import DlcResolver from './dlc-resolver.mjs'
import { FactionDbObject, LeaderDbObject } from '@gwent/graphql-schema/database-typings'
import FactionResolver from './faction-resolver.mjs'
import { getUniqueItems } from '@gwent/utils'
import LeaderStore from '../../database/stores/leader-store.mjs'
import Verifier from '../../util/verifier.mjs'

/**
 * A class to convert Leader database objects to their GraphQL equivalent.
 */
export default class LeaderResolver {
  private static logger = log4js.getLogger('leader-resolver')

  /**
   * Converts a single Leader database object to a single Leader GraphQL object.
   *
   * @param config The configuration used to convert the Leader.
   * @param config.unit The resolved DLC for the Leader. If not provided, will be retrieved.
   * @param config.faction The resolved Faction for the Leader. If not provided, will be retrieved.
   * @param config.leader The Leader to convert.
   * @param config.neutralStats Whether or not to account for the Neutral faction when calculating the stats of the Leader.
   * @returns The resolved Leader object matching its GraphQL schema definition.
   */
  static async fromObject({
    dlc,
    faction,
    leader,
    neutralStats,
  }: {
    dlc?: Dlc
    faction?: Faction
    leader: LeaderDbObject
    neutralStats?: boolean
  }): Promise<Leader> {
    return {
      ability: leader.ability,
      created: leader.created,
      dlc: leader.dlc && (dlc || (await DlcResolver.fromId(leader.dlc))),
      faction:
        faction ||
        (await FactionResolver.fromId({
          id: leader.faction,
          neutrals: neutralStats,
        })),
      id: leader._id.toString(),
      image: leader.image,
      name: leader.name,
      quote: leader.quote,
    }
  }

  /**
   * Retrieves a Leader with the given ID and converts it to the GraphQL object equivalent.
   *
   * @param id The ObjectID of the Leader to convert.
   * @returns The resolved Leader object with the given ID.
   * @throws Error if a Leader with the given ID does not exist.
   */
  static async fromId({ id, neutralStats }: { id: string | ObjectId; neutralStats?: boolean }): Promise<Leader> {
    const leaders = await LeaderResolver.fromIds({
      ids: [id],
      neutralStats,
    })
    return leaders[0]
  }

  /**
   * Retrieves Leaders with the given IDs and converts them to their GraphQL object equivalents.
   *
   * @param ids The ObjectIDs of the Leaders to convert.
   * @returns The resolved Leaders array for the given IDs.
   * @throws Error if a Leader with the given IDs does not exist.
   */
  static async fromIds({
    ids,
    factions,
    resolvedFactions,
    neutralStats,
  }: {
    ids: (ObjectId | string)[]
    factions?: FactionDbObject[]
    resolvedFactions?: Faction[]
    neutralStats?: boolean
  }): Promise<Leader[]> {
    if (ids.length === 0) {
      return []
    }

    const leaders = await LeaderStore.get({
      ids: ids,
    })

    Verifier.checkObjects({
      expectedKeys: ids,
      objects: leaders,
      field: '_id',
      logger: LeaderResolver.logger,
      label: 'leaders',
    })

    return LeaderResolver.fromArray({
      leaders,
      factions,
      resolvedFactions,
      neutralStats,
    })
  }

  /**
   * Converts an array of Leader database objects to an array of Leader GraphQL objects.
   *
   * @param config The configuration used to convert the array.
   * @param config.factions The resolved Factions for the Leaders. If not provided, will be retrieved.
   * @param config.leaders The array of Leader database objects to convert.
   * @param config.resolvedFactions The resolved Factions for the Leaders. If not provided, will be retrieved.
   * @param config.neutralStats Whether or not to account for the Neutral faction when calculating the stats of the Factions of the Leaders.
   * @returns The resolved Leader array matching the GraphQL schema definition.
   */
  static async fromArray({
    factions,
    leaders,
    neutralStats,
    resolvedFactions,
  }: {
    factions?: FactionDbObject[]
    leaders: LeaderDbObject[]
    neutralStats?: boolean
    resolvedFactions?: Faction[]
  }): Promise<Leader[]> {
    const dlcIds = getUniqueItems<ObjectId>(leaders.map((leader) => leader.dlc))
    const dlcs = await DlcResolver.fromIds(dlcIds)

    if (!resolvedFactions) {
      if (factions) {
        resolvedFactions = await FactionResolver.fromArray({
          factions,
          neutralStats,
        })
      } else {
        const factionIds = getUniqueItems<ObjectId>(leaders.map((leader) => leader.faction))
        resolvedFactions = await FactionResolver.fromIds({
          ids: factionIds,
          neutralStats,
        })
      }
    }

    const resolvedLeaders: Leader[] = []
    for (const leader of leaders) {
      resolvedLeaders.push(
        await LeaderResolver.fromObject({
          leader,
          dlc: leader.dlc && dlcs.find((dlc) => dlc.id.toString() === leader.dlc?.toString()),
          faction: resolvedFactions.find((faction) => faction.id.toString() === leader.faction.toString()),
          neutralStats,
        })
      )
    }

    return resolvedLeaders
  }
}
