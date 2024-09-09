import { DlcDbObject } from '@gwent/graphql-schema/database-typings'
import { Dlc, DlcKey } from '@gwent/graphql-schema/resolver-typings'
import { ObjectId } from 'mongodb'
import DlcStore from '../../database/stores/dlc-store'
import { getLogger } from 'log4js'
import Verifier from '../../util/verifier'

export default class DlcResolver {
  private static logger = getLogger('dlc-resolver')

  static fromObject(dlc: DlcDbObject): Dlc {
    return {
      created: dlc.created,
      id: dlc._id.toString(),
      image: dlc.image,
      key: dlc.key as DlcKey,
      name: dlc.name,
    }
  }

  static async fromId(id: ObjectId | string): Promise<Dlc> {
    const dlcs = await DlcResolver.fromIds([id])
    return dlcs[0]
  }

  static async fromIds(ids: (ObjectId | string)[]): Promise<Dlc[]> {
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
      label: 'dlcs',
    })

    return dlcs.map((dlc) => DlcResolver.fromObject(dlc))
  }
}
