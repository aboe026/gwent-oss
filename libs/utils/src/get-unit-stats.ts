import {
  DeckUnitFragment,
  UnitEffectFragmentDoc,
  UnitFragmentDoc,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'
import { Combat, DeckUnit, UnitStats, EffectKey } from '@gwent/graphql-schema/resolver-typings'

/**
 * A class used to calculate statistics for Units in a Deck.
 */
export default class GetUnitStats {
  /**
   * Get the statistics for the given DeckUnits.
   *
   * @param deckUnits The Units to calculate statistics for.
   * @returns The statistics for a deck with the given units.
   */
  static fromDeckUnits(deckUnits: DeckUnit[]): UnitStats {
    return GetUnitStats.getUnitStats(
      deckUnits.map((deckUnit) => {
        return {
          combats: deckUnit.unit.combats,
          deckable: deckUnit.unit.deckable,
          effects: deckUnit.unit.effects?.map((effect) => effect.key),
          hero: deckUnit.unit.hero,
          special: deckUnit.unit.special,
          strength: deckUnit.unit.strength,
        }
      })
    )
  }

  /**
   * Get the statistics for the given Deck Unit Fragments.
   *
   * @param deckUnits The fragments to calculate statistics for.
   * @returns The statistics for a deck with the given units.
   */
  static fromDeckUnitFragments(deckUnits: DeckUnitFragment[]): UnitStats {
    return GetUnitStats.getUnitStats(
      deckUnits.map((deckUnit) => {
        const unit = useFragment(UnitFragmentDoc, deckUnit.unit)
        return {
          combats: unit.combats,
          deckable: unit.deckable,
          effects: useFragment(UnitEffectFragmentDoc, unit.effects)?.map((effect) => effect.key),
          hero: unit.hero,
          special: unit.special,
          strength: unit.strength,
        }
      })
    )
  }

  /**
   * Get the statistics for a deck with the given unit inputs.
   *
   * @param deckUnits The relevant information from units in the deck which effect the statistics.
   * @returns The statistics for the deck comprised of the given units.
   */
  private static getUnitStats(deckUnits: DeckUnitForValidation[]): UnitStats {
    let agile = 0
    let avenger = 0
    let berserker = 0
    let bond = 0
    let decoy = 0
    let horn = 0
    let mardroeme = 0
    let medic = 0
    let morale = 0
    let muster = 0
    let scorch = 0
    let spy = 0
    let weather = 0

    let close = 0
    let ranged = 0
    let siege = 0

    let heroes = 0
    let specials = 0
    let strengths = 0
    let strengthTotal = 0
    let units = 0

    for (const deckUnit of deckUnits) {
      if (deckUnit.deckable) {
        if (deckUnit.effects) {
          if (deckUnit.effects.includes(EffectKey.Agile)) {
            agile++
          }
          if (deckUnit.effects.includes(EffectKey.Avenger)) {
            avenger++
          }
          if (deckUnit.effects.includes(EffectKey.Berserker)) {
            berserker++
          }
          if (deckUnit.effects.includes(EffectKey.Bond)) {
            bond++
          }
          if (deckUnit.effects.includes(EffectKey.Decoy)) {
            decoy++
          }
          if (deckUnit.effects.includes(EffectKey.Horn)) {
            horn++
          }
          if (deckUnit.effects.includes(EffectKey.Mardroeme)) {
            mardroeme++
          }
          if (deckUnit.effects.includes(EffectKey.Medic)) {
            medic++
          }
          if (deckUnit.effects.includes(EffectKey.Morale)) {
            morale++
          }
          if (deckUnit.effects.includes(EffectKey.Muster)) {
            muster++
          }
          if (deckUnit.effects.includes(EffectKey.Scorch)) {
            scorch++
          }
          if (deckUnit.effects.includes(EffectKey.Spy)) {
            spy++
          }
          if (deckUnit.effects.includes(EffectKey.Weather)) {
            weather++
          }
        }

        if (deckUnit.combats && !deckUnit.special) {
          if (deckUnit.combats.includes(Combat.Close)) {
            close++
          }
          if (deckUnit.combats.includes(Combat.Ranged)) {
            ranged++
          }
          if (deckUnit.combats.includes(Combat.Siege)) {
            siege++
          }
        }

        if (deckUnit.hero) {
          heroes++
        }
        if (deckUnit.special) {
          specials++
        }
        if (deckUnit.strength !== undefined && deckUnit.strength !== null) {
          strengthTotal += deckUnit.strength
          strengths++
        }
        units++
      }
    }

    return {
      agile,
      avenger,
      berserker,
      bond,
      close,
      decoy,
      heroes,
      horn,
      mardroeme,
      medic,
      morale,
      muster,
      ranged,
      scorch,
      siege,
      specials,
      spy,
      strengthAverage: units === 0 ? 0 : strengthTotal / units,
      strengths,
      strengthTotal,
      units,
      weather,
    }
  }
}

export interface DeckUnitForValidation {
  deckable: boolean
  effects: (EffectKey | undefined)[] | undefined | null
  combats: (Combat | undefined)[] | undefined | null
  hero: boolean | undefined | null
  special: boolean | undefined | null
  strength: number | undefined | null
}
