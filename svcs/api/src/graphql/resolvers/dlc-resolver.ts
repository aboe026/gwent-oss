import { DlcDbObject } from '@gwent/graphql-schema/database-typings'
import { Dlc, DlcKey } from '@gwent/graphql-schema/resolver-typings'
import { ObjectId } from 'mongodb'
import DlcStore from '../../database/stores/dlc-store'

export default class DlcResolver {
  static resolveFromObject(dlc?: DlcDbObject): Dlc | null {
    if (dlc) {
      return {
        created: dlc.created,
        id: dlc._id.toString(),
        image: dlc.image,
        key: dlc.key as DlcKey,
        name: dlc.name,
      }
    }
    return null
  }

  static async resolveFromId(id?: ObjectId | string): Promise<Dlc | null> {
    if (id) {
      return (await DlcResolver.resolveFromIds([id]))[0]
    }
    return null
  }

  static async resolveFromIds(ids: (ObjectId | string)[]): Promise<Dlc[]> {
    if (ids.length === 0) {
      return []
    }
    const dlcs = await DlcStore.get({
      ids,
    })
    return dlcs.map((dlc) => DlcResolver.resolveFromObject(dlc)) as Dlc[]
  }
}
