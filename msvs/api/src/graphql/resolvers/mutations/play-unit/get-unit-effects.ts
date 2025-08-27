import { EffectDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import EffectStore from '../../../../database/stores/effect-store'

/**
 * Gets the Effect database documents for all effects present on a list of Unit database objects.
 *
 * @param config The configuration used to get the Effects for the Units.
 * @param config.units The units containing potential effect IDs that the full Effect database documents should be grabbed for.
 * @param config.effects Potential list of Effect documents alread retrieved.
 * @returns The database documents of any Effects present in the Unit objects.
 */
export default async function getUnitEffects({
  units,
  effects = [],
}: {
  units: UnitDbObject[]
  effects?: EffectDbObject[]
}): Promise<EffectDbObject[]> {
  const existingEffectIds: string[] = []
  for (const effect of effects) {
    const effectId = effect._id.toString()
    if (!existingEffectIds.includes(effectId)) {
      existingEffectIds.push(effectId)
    }
  }
  const effectIdsToGet: string[] = []
  for (const unit of units) {
    if (unit.effects) {
      for (const unitEffect of unit.effects) {
        const effectId = unitEffect.toString()
        if (!effectIdsToGet.includes(effectId) && !existingEffectIds.includes(effectId)) {
          effectIdsToGet.push(effectId)
        }
      }
    }
  }

  return effectIdsToGet.length === 0
    ? []
    : await EffectStore.get({
        ids: effectIdsToGet,
      })
}
