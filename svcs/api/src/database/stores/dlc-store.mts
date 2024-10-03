import { Document, Filter, ObjectId } from 'mongodb'
import log4js from 'log4js'

import { DlcDbObject, DlcKey } from '@gwent/graphql-schema/database-typings'
import Store from './store.mjs'

/**
 * Factory for possible DLCs that Gwent resources can belong to.
 */
export default class DlcStore extends Store {
  static readonly COLLECTION_NAME = 'dlcs'
  private static logger = log4js.getLogger('dlc-store')

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
