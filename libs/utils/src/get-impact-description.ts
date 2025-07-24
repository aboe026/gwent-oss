import { EffectKey, GameUnitOrigin } from '@gwent/graphql-schema/resolver-typings'

/**
 * Gets the description text for an impact on a unit due to a given effect.
 *
 * @param config The configuration to use to determine the description.
 * @param config.effectKey The Key of the Effect which caused the impact.
 * @returns The description of the impact on a unit from the effect.
 * @throws Error if Effect cannot have impact (Agile, Avenger, Berserker)
 */
export default function getImpactDescription({
  effectKey,
  origin,
}: {
  effectKey: EffectKey
  origin?: GameUnitOrigin
}): string {
  if (effectKey === EffectKey.Bond) {
    return 'bonded in strength'
  } else if (effectKey === EffectKey.Decoy) {
    return 'decoyed from battlefield'
  } else if (effectKey === EffectKey.Horn) {
    return "strengthened by Commander's Horn"
  } else if (effectKey === EffectKey.Mardroeme) {
    return 'transformed by Mardroeme'
  } else if (effectKey === EffectKey.Medic) {
    return 'revived by Medic'
  } else if (effectKey === EffectKey.Morale) {
    return 'moraled in strength'
  } else if (effectKey === EffectKey.Muster) {
    let resolvedOrigin = ''
    if (origin === GameUnitOrigin.Hand) {
      resolvedOrigin = 'Hand'
    } else if (origin === GameUnitOrigin.Undrawn) {
      resolvedOrigin = 'Draw pile'
    } else {
      throw Error(
        `Invalid source "${origin}" for "${effectKey}" impact. Must be either "${GameUnitOrigin.Hand}" or "${GameUnitOrigin.Undrawn}".`
      )
    }
    return `mustered from ${resolvedOrigin}`
  } else if (effectKey === EffectKey.Scorch) {
    return 'scorched from battlefield'
  } else if (effectKey === EffectKey.Spy) {
    return 'spied into battlefield'
  } else if (effectKey === EffectKey.Weather) {
    return 'weathered in battlefield'
  }
  throw Error(`No impact description for effect "${effectKey}"`)
}
