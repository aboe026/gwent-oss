import { EffectKey } from '@gwent/graphql-schema/resolver-typings'

export default function getImpactDescription({ effectKey }: { effectKey: EffectKey }): string {
  let description = ''
  if (effectKey === EffectKey.Morale) {
    description = 'moraled in strength'
  } else if (effectKey === EffectKey.Scorch) {
    description = 'scorched from battlefield'
  }
  return description
}
