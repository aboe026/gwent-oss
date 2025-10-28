import { EffectDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'

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
