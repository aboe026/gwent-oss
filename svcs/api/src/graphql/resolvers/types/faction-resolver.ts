import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Dlc, Faction, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import DlcResolver from './dlc-resolver'
import { FactionDbObject } from '@gwent/graphql-schema/database-typings'
import FactionStore from '../../../database/stores/faction-store'
import { getUniqueItems } from '@gwent/utils'
import Verifier from '../../../util/verifier'

/**
 * A class to convert Faction database objects to their GraphQL equivalent.
 */
export default class FactionResolver {
  private static logger = getLogger('FactionResolver')

  /**
   * Converts a single Faction database object to a single Faction GraphQL object.
   *
   * @param config The configuration used to convert the Faction.
   * @param config.dlc The resolved DLC for the Faction. If not provided, will be retrieved.
   * @param config.faction The Faction to convert.
   * @returns The resolved Faction object matching its GraphQL schema definition.
   */
  static async fromObject({ dlc, faction }: { dlc?: Dlc | null; faction: FactionDbObject }): Promise<Faction> {
    return {
      created: faction.created,
      id: faction._id.toString(),
      image: faction.image,
      key: faction.key as FactionKey,
      name: faction.name,
      stats: faction.stats,
      ability: faction.ability,
      dlc: faction.dlc && (dlc || (await DlcResolver.fromId(faction.dlc))),
    }
  }

  /**
   * Retrieves a Faction with the given ID and converts it to the GraphQL object equivalent.
   *
   * @param id The ObjectId of the Faction to convert.
   * @returns The resolved Faction object with the given ID.
   * @throws Error if a Faction with the given ID does not exist.
   */
  static async fromId({ id }: { id: ObjectId | string }): Promise<Faction> {
    const factions = await FactionResolver.fromIds({
      ids: [id],
    })
    return factions && factions[0]
  }

  /**
   * Retrieves Factions with the given IDs and converts them to their GraphQL object equivalents.
   *
   * @param ids The ObjectIds of the Factions to convert.
   * @returns The resolved Factions array for the given IDs.
   * @throws Error if a Faction with the given IDs does not exist.
   */
  static async fromIds({ ids }: { ids: (ObjectId | string)[] }): Promise<Faction[]> {
    if (ids.length === 0) {
      return []
    }

    const factions = await FactionStore.get({
      ids: ids,
    })

    Verifier.checkObjects({
      expectedKeys: ids,
      objects: factions,
      field: '_id',
      logger: FactionResolver.logger,
      label: 'factions',
    })

    return FactionResolver.fromArray({
      factions,
    })
  }

  /**
   * Converts an array of Faction database objects to an array of Faction GraphQL objects.
   *
   * @param config The configuration used to convert the array.
   * @param config.factions The array of Faction database objects to convert.
   * @returns The resolved Faction array matching the GraphQL schema definition.
   */
  static async fromArray({ factions }: { factions: FactionDbObject[] }): Promise<Faction[]> {
    const dlcIds = getUniqueItems<ObjectId>(factions.map((faction) => faction.dlc))
    const dlcs = await DlcResolver.fromIds(dlcIds)

    const resolvedFactions: Faction[] = []
    for (const faction of factions) {
      resolvedFactions.push(
        await FactionResolver.fromObject({
          faction,
          dlc: faction.dlc && dlcs.find((dlc) => dlc.id.toString() === faction.dlc?.toString()),
        })
      )
    }
    return resolvedFactions
  }
}
