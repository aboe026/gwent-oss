import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Dlc, DlcKey } from '@gwent/graphql-schema/resolver-typings'
import { DlcDbObject } from '@gwent/graphql-schema/database-typings'
import DlcStore from '../../database/stores/dlc-store'
import Verifier from '../../util/verifier'

/**
 * A class to convert DLC database objects to their GraphQL equivalent.
 */
export default class DlcResolver {
  private static logger = getLogger('dlc-resolver')

  /**
   * Converts a single DLC database object to a single DLC GraphQL object.
   *
   * @param dlc The DLC database object to convert.
   * @returns The resolved DLC object matching its GraphQL schema definition.
   */
  static fromObject(dlc: DlcDbObject): Dlc {
    return {
      created: dlc.created,
      id: dlc._id.toString(),
      image: dlc.image,
      key: dlc.key as DlcKey,
      name: dlc.name,
    }
  }

  /**
   * Retrieves a DLC with the given ID and converts it to the GraphQL object equivalent.
   *
   * @param id The ObjectID of the DLC to convert.
   * @returns The resolved DLC object with the given ID.
   * @throws Error if a DLC with the given ID does not exist.
   */
  static async fromId(id: ObjectId | string): Promise<Dlc> {
    const dlcs = await DlcResolver.fromIds([id])
    return dlcs[0]
  }

  /**
   * Retrieves Dlcs with the given IDs and converts them to their GraphQL object equivalents.
   *
   * @param ids The ObjectIDs of the Dlcs to convert.
   * @returns The resolved Dlcs array for the given IDs.
   * @throws Error if a Dlc with the given IDs does not exist.
   */
  static async fromIds(ids: (ObjectId | string)[]): Promise<Dlc[]> {
    if (ids.length === 0) {
      return []
    }

    const dlcs = await DlcStore.get({
      ids,
    })

    Verifier.checkObjects({
      expectedKeys: ids,
      objects: dlcs,
      field: '_id',
      logger: DlcResolver.logger,
      label: 'dlcs',
    })

    return dlcs.map((dlc) => DlcResolver.fromObject(dlc))
  }
}
