import { DlcDbObject } from '@gwent/graphql-schema/database-typings'
import { Dlc, DlcKey } from '@gwent/graphql-schema/resolver-typings'
import { ObjectId } from 'mongodb'
import DlcStore from '../../database/stores/dlc-store'
import { getLogger } from 'log4js'

export default class DlcResolver {
  private static logger = getLogger('dlc-resolver')

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
      const dlcs = await DlcResolver.resolveFromIds([id])
      if (dlcs.length > 1) {
        const message = `Multiple dlcs with ID "${id}" resolved.`
        DlcResolver.logger.error(message)
        throw Error(message)
      }
      return dlcs && dlcs[0]
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
    const resolvedDlcs: Dlc[] = []
    for (const id of ids) {
      const dlc = dlcs.find((dlc) => dlc._id.toString() === id.toString())
      if (!dlc) {
        const message = `Could not resolve dlc "${id}".`
        DlcResolver.logger.error(message)
        throw Error(message)
      }
      resolvedDlcs.push(DlcResolver.resolveFromObject(dlc) as Dlc)
    }
    return resolvedDlcs
  }
}
