import { ObjectId } from 'mongodb'

import { DlcDbObject, EffectDbObject, FactionDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import DlcStore from '../../database/stores/dlc-store'
import EffectStore from '../../database/stores/effect-store'
import FactionStore from '../../database/stores/faction-store'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function resolveDlc({ dlc }: { dlc?: ObjectId | any; [x: string]: any }): Promise<DlcDbObject> {
  if (dlc && ObjectId.isValid(dlc)) {
    const dlcs = await DlcStore.get({
      ids: [dlc],
    })
    return dlcs[0]
  }
  return dlc as any as DlcDbObject // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function resolveEffects(unit: UnitDbObject): Promise<EffectDbObject[]> {
  const effects: EffectDbObject[] = []
  const effectIdsToGet: string[] = []
  if (unit.effects) {
    for (const unitEffect of unit.effects) {
      if (ObjectId.isValid(unitEffect)) {
        const id = unitEffect.toString()
        if (!effectIdsToGet.includes(id)) {
          effectIdsToGet.push(id)
        }
      } else {
        effects.push(unitEffect as any as EffectDbObject) // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    }
    if (effectIdsToGet.length > 0) {
      const dbEffects = await EffectStore.get({
        ids: effectIdsToGet,
      })
      for (const unitEffect of unit.effects) {
        if (ObjectId.isValid(unitEffect)) {
          const id = unitEffect.toString()
          const dbEffect = dbEffects.find((effect) => effect._id.toString() === id)
          if (!dbEffect) {
            throw Error(`Could not find effect with ID "${id}".`)
          }
          effects.push(dbEffect)
        }
      }
    }
  }
  return EffectStore.resolveAbilitiesForUnit(unit, effects)
}

export async function resolveFaction({
  faction,
}: {
  faction?: ObjectId | any // eslint-disable-line @typescript-eslint/no-explicit-any
  [x: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
}): Promise<FactionDbObject> {
  if (ObjectId.isValid(faction)) {
    const factions = await FactionStore.get({
      ids: [faction],
    })
    return factions[0]
  }
  return faction as any as FactionDbObject // eslint-disable-line @typescript-eslint/no-explicit-any
}
