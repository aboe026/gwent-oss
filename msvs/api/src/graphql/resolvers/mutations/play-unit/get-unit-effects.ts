import { EffectDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import EffectStore from '../../../../database/stores/effect-store'

/**
 * Gets the Effect database documents for all effects present on a list of Unit database objects.
 *
 * @param units The units containing potential effect IDs that the full Effect database documents should be grabbed for.
 * @returns The database documents of any Effects present in the Unit objects.
 */
// TODO: add effects object for existing effects already captured to not needlessly retrieve effects already have
export default async function getUnitEffects(units: UnitDbObject[]): Promise<EffectDbObject[]> {
  const effectIds: string[] = []
  for (const unit of units) {
    if (unit.effects) {
      for (const unitEffect of unit.effects) {
        const effect = unitEffect.toString()
        if (!effectIds.includes(effect)) {
          effectIds.push(effect)
        }
      }
    }
  }

  if (effectIds.length === 0) {
    return []
  } else {
    return EffectStore.get({
      ids: effectIds,
    })
  }
}
