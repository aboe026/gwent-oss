import { Document, Filter, ObjectId } from 'mongodb'
import { getLogger } from 'log4js'

import { DlcDbObject, DlcKey } from '@gwent/graphql-schema/database-typings'
import Store from './store'

/**
 * Factory for possible DLCs that Gwent resources can belong to.
 */
export default class DlcStore extends Store {
  static readonly COLLECTION_NAME = 'dlcs'
  private static logger = getLogger('dlc-store')

  /**
   * Adds a DLC to the database.
   *
   * @param {Object} dlc The DLC to add.
   * @param dlc.image The name of the DLC to add.
   * @param dlc.key The key of the DLC to add.
   * @param dlc.name The name of the DLC to add.
   * @returns The DLC database document.
   */
  static async add({ image, key, name }: AddDlcInput): Promise<DlcDbObject> {
    DlcStore.logger.debug(`Adding DLC with name "${name}"`)
    const dlc: Document = {
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
