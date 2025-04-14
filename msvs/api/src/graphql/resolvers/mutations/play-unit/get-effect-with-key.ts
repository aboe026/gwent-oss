import { EffectDbObject, EffectKey } from '@gwent/graphql-schema/database-typings'

export default function getEffectWithKey({
  effectKey,
  effects,
}: {
  effectKey: EffectKey
  effects: EffectDbObject[]
}): EffectDbObject | undefined {
  if (effects.length > 0) {
    const effectsWithKey = effects.filter((effect) => effect.key === effectKey.toString())
    if (effectsWithKey.length > 1) {
      // TODO: log the effects
      throw Error(`Found more than 1 effect with key "${effectKey}"`)
    }
    return effectsWithKey[0]
  }
}
