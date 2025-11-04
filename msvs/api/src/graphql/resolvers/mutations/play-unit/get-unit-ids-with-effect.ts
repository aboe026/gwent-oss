import { EffectDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * Gets the IDs of all units which contain the Effect.
 *
 * @param config The configuration used to determine which effect to retrieve units for.
 * @param config.effect The Effect database doc to search Units for.
 * @param config.units The Units whose IDs should be returned if they contain the Effect.
 * @returns An array of Unit IDs which contain the Effect.
 */
export default function getUnitIdsWithEffect({
  effect,
  units,
}: {
  effect: EffectDbObject | undefined
  units: UnitDbObject[]
}): string[] {
  const unitIdsWithEffect: string[] = []

  if (effect) {
    for (const unit of units) {
      if (unit.effects) {
        let hasEffect = false
        for (let i = 0; i < unit.effects.length && !hasEffect; i++) {
          const unitEffect = unit.effects[i]
          if (unitEffect.toString() === effect._id.toString()) {
            hasEffect = true
          }
        }
        if (hasEffect) {
          unitIdsWithEffect.push(unit._id.toString())
        }
      }
    }
  }

  return unitIdsWithEffect
}
