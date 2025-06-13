import { EffectKey } from '@gwent/graphql-schema/resolver-typings'

export default function getNoImpactMessage({ effectKey }: { effectKey: EffectKey }): string {
  let noImpactMessage = ''
  if (effectKey === EffectKey.Bond) {
    noImpactMessage = 'No similar units in row to bond with.'
  } else if (effectKey === EffectKey.Horn) {
    noImpactMessage = 'No eligible units in row to strengthen.'
  } else if (effectKey === EffectKey.Mardroeme) {
    noImpactMessage = 'No Berserkers in row to transform.'
  } else if (effectKey === EffectKey.Medic) {
    noImpactMessage = 'No eligible units in Lost to revive.'
  } else if (effectKey === EffectKey.Muster) {
    noImpactMessage = 'No eligible units in Draw to muster.'
  } else if (effectKey === EffectKey.Morale) {
    noImpactMessage = 'No eligible units in row to strengthen.'
  } else if (effectKey === EffectKey.Scorch) {
    noImpactMessage = 'No eligible units on battlefield to scorch.'
  } else if (effectKey === EffectKey.Spy) {
    noImpactMessage = 'No units in Draw to add to Hand.'
  } else if (effectKey === EffectKey.Weather) {
    noImpactMessage = 'No eligible units on battlefield to weaken.'
  }
  return noImpactMessage
}
