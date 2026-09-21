import { EffectKey, FactionKey, GameUnitOrigin } from '@gwent-oss/graphql-schema/resolver-typings'
import ordinalizeNumber from './ordinalize-number'

/**
 * Gets the description text for an impact on a unit due to a given effect.
 *
 * @param config The configuration to use to determine the description.
 * @param config.effectKey The Key of the Effect which caused the impact.
 * @param config.factionKey The Key of the Faction which caused the impact.
 * @param config.origin The Origin of the unit which caused the impact.
 * @param config.name The name of the unit the mardroeme transformed the card into.
 * @param config.index The zero-based index of the Impact for the Move.
 * @returns The description of the impact on a unit from the effect.
 * @throws {Error} if Effect cannot have impact (Agile, Avenger, Berserker)
 */
export default function getImpactDescription({
  effectKey,
  factionKey,
  origin,
  name,
  index,
}: {
  effectKey?: EffectKey
  factionKey?: FactionKey
  origin?: GameUnitOrigin
  name?: string
  index?: number
}): string {
  if (effectKey && factionKey) {
    throw Error(`Cannot get description when both effectKey (${effectKey}) and factionKey (${factionKey}) specified.`)
  }
  if (effectKey === EffectKey.Avenger) {
    return 'avenged when removed from battlefield'
  } else if (effectKey === EffectKey.Bond) {
    return 'bonded in strength'
  } else if (effectKey === EffectKey.Decoy) {
    return 'decoyed from battlefield'
  } else if (effectKey === EffectKey.Horn) {
    return "strengthened by Commander's Horn"
  } else if (effectKey === EffectKey.Mardroeme) {
    if (!name) {
      throw Error(`Must specify name for "${EffectKey.Mardroeme}" impact.`)
    }
    return `transformed by Mardroeme into ${name === 'Young Berserker' ? 'Transformed Young Vildkaarl' : 'Transformed Vildkaarl'}`
  } else if (effectKey === EffectKey.Medic) {
    return 'revived by Medic'
  } else if (effectKey === EffectKey.Morale) {
    return 'moraled in strength'
  } else if (effectKey === EffectKey.Muster) {
    let resolvedOrigin: string
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
    return 'spied from undrawn into hand'
  } else if (effectKey === EffectKey.Weather) {
    return 'weathered in battlefield'
  }
  if (factionKey === FactionKey.Monsters) {
    return 'remained on battlefield from last round'
  } else if (factionKey === FactionKey.NilfgaardianEmpire) {
    return 'won the round instead of sharing a draw'
  } else if (factionKey === FactionKey.NorthernRealms) {
    return 'handed from draw pile'
  } else if (factionKey === FactionKey.ScoiaTael) {
    if (index === undefined) {
      throw Error(`Index required for Scoia'Tael faction description`)
    }
    return `ordered as ${ordinalizeNumber(index + 1)} player to take turn on game`
  } else if (factionKey === FactionKey.Skellige) {
    return 'fielded from lost pile'
  }
  throw Error(`No impact description for effect "${effectKey}" or faction "${factionKey}"`)
}
