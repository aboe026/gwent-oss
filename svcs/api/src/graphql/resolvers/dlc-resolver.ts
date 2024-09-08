import { DlcDbObject } from '@gwent/graphql-schema/database-typings'
import { Dlc, DlcKey } from '@gwent/graphql-schema/resolver-typings'
import { ObjectId } from 'mongodb'
import DlcStore from '../../database/stores/dlc-store'
import { getLogger } from 'log4js'
import Verifier from '../../util/verify-objects'

export default class DlcResolver {
  private static logger = getLogger('dlc-resolver')

  static resolveFromObject(dlc: DlcDbObject): Dlc {
    return {
      created: dlc.created,
      id: dlc._id.toString(),
      image: dlc.image,
      key: dlc.key as DlcKey,
      name: dlc.name,
    }
  }

  static async resolveFromId(id: ObjectId | string): Promise<Dlc> {
    const dlcs = await DlcResolver.resolveFromIds([id])
    return dlcs[0]
  }

  static async resolveFromIds(ids: (ObjectId | string)[]): Promise<Dlc[]> {
    const dlcs =
      ids.length === 0
        ? []
        : await DlcStore.get({
            ids,
          })

    Verifier.checkObjects({
      expectedKeys: ids,
      objects: dlcs,
      field: '_id',
      logger: DlcResolver.logger,
      resourceLabelPlural: 'dlcs',
    })

    return dlcs.map((dlc) => DlcResolver.resolveFromObject(dlc))
  }
}
