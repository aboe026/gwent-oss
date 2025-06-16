import { EffectKey } from '@gwent/graphql-schema/resolver-typings'

export default function getNoImpactMessage({ effectKey }: { effectKey: EffectKey }): string {
  if (effectKey === EffectKey.Bond) {
    return 'No similar units in row to bond with.'
  } else if (effectKey === EffectKey.Horn) {
    return 'No eligible units in row to strengthen.'
  } else if (effectKey === EffectKey.Mardroeme) {
    return 'No Berserkers in row to transform.'
  } else if (effectKey === EffectKey.Medic) {
    return 'No eligible units in Lost to revive.'
  } else if (effectKey === EffectKey.Muster) {
    return 'No eligible units in Draw to muster.'
  } else if (effectKey === EffectKey.Morale) {
    return 'No eligible units in row to strengthen.'
  } else if (effectKey === EffectKey.Scorch) {
    return 'No eligible units on battlefield to scorch.'
  } else if (effectKey === EffectKey.Spy) {
    return 'No eligible units in Draw to add to Hand.'
  } else if (effectKey === EffectKey.Weather) {
    return 'No eligible units on battlefield to weaken.'
  }
  throw Error(`Effect "${effectKey}" is not impactable.`)
}
