import { Document, Filter, ObjectId, WithoutId } from 'mongodb'
import { getLogger } from 'log4js'

import { DlcDbObject, DlcKey } from '@gwent-oss/graphql-schema/database-typings'
import Store from './store'

/**
 * Factory for possible DLCs that resources can belong to.
 */
export default class DlcStore extends Store {
  static readonly COLLECTION_NAME = 'dlcs'
  private static logger = getLogger('DlcStore')

  /**
   * Adds a DLC to the database.
   *
   * @param config The configuration used to add the DLC.
   * @param config.image The name of the DLC to add.
   * @param config.key The key of the DLC to add.
   * @param config.name The name of the DLC to add.
   * @returns The DLC database document.
   */
  static async add({ image, key, name }: AddDlcInput): Promise<DlcDbObject> {
    DlcStore.logger.debug(`Adding DLC with name "${name}"`)
    const dlc: WithoutId<DlcDbObject> = {
      created: new Date(),
      image,
      key,
      name,
    }
    if (DlcStore.logger.isTraceEnabled()) {
      DlcStore.logger.trace(`Adding dlc: "${JSON.stringify(dlc)}"`)
    }
    return DlcStore.create<DlcDbObject>(dlc)
  }

  /**
   * Get all possible DLCs a resource can be apart of.
   *
   * @param options The options to filter DLCs to.
   * @param options.ids The ObjectIds to filter DLCs to.
   * @param options.keys The keys to filter DLCs to.
   * @returns DCLs for resources.
   */
  static async get({ ids, keys }: GetDlcsInput): Promise<DlcDbObject[]> {
    if (DlcStore.logger.isDebugEnabled()) {
      DlcStore.logger.debug(`Getting by ids "${JSON.stringify(ids)}" and keys "${JSON.stringify(keys)}"`)
    }
    const filter: Filter<Document> = {}
    if (ids) {
      filter._id = {
        $in: ids.map((id) => new ObjectId(id)),
      }
    }
    if (keys) {
      filter.key = {
        $in: keys,
      }
    }
    if (DlcStore.logger.isTraceEnabled()) {
      DlcStore.logger.trace(`get filter: "${JSON.stringify(filter)}"`)
    }
    return DlcStore.read<DlcDbObject[]>({ filter })
  }
}

export interface AddDlcInput {
  image: string
  key: DlcKey
  name: string
}

export interface GetDlcsInput {
  ids?: (string | ObjectId)[]
  keys?: DlcKey[]
}
