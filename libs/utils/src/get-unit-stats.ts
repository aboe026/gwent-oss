import { Combat, DeckUnit, UnitStats, EffectKey } from '@gwent/graphql-schema/resolver-typings'

/**
 * Returns the statistics for the set of Deck Units.
 *
 * @param deckUnits The set of Deck Units to get statistics for.
 * @returns The statistics for the set of Deck Units.
 */
export default function getUnitStats(deckUnits: DeckUnit[]): UnitStats {
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
    if (deckUnit.unit.deckable) {
      if (deckUnit.unit.effects?.map((effect) => effect.key).includes(EffectKey.Agile)) {
        agile++
      }
      if (deckUnit.unit.effects?.map((effect) => effect.key).includes(EffectKey.Avenger)) {
        avenger++
      }
      if (deckUnit.unit.effects?.map((effect) => effect.key).includes(EffectKey.Berserker)) {
        berserker++
      }
      if (deckUnit.unit.effects?.map((effect) => effect.key).includes(EffectKey.Bond)) {
        bond++
      }
      if (deckUnit.unit.effects?.map((effect) => effect.key).includes(EffectKey.Decoy)) {
        decoy++
      }
      if (deckUnit.unit.effects?.map((effect) => effect.key).includes(EffectKey.Horn)) {
        horn++
      }
      if (deckUnit.unit.effects?.map((effect) => effect.key).includes(EffectKey.Mardroeme)) {
        mardroeme++
      }
      if (deckUnit.unit.effects?.map((effect) => effect.key).includes(EffectKey.Medic)) {
        medic++
      }
      if (deckUnit.unit.effects?.map((effect) => effect.key).includes(EffectKey.Morale)) {
        morale++
      }
      if (deckUnit.unit.effects?.map((effect) => effect.key).includes(EffectKey.Muster)) {
        muster++
      }
      if (deckUnit.unit.effects?.map((effect) => effect.key).includes(EffectKey.Scorch)) {
        scorch++
      }
      if (deckUnit.unit.effects?.map((effect) => effect.key).includes(EffectKey.Spy)) {
        spy++
      }
      if (deckUnit.unit.effects?.map((effect) => effect.key).includes(EffectKey.Weather)) {
        weather++
      }

      if (deckUnit.unit.combats && deckUnit.unit.combats.includes(Combat.Close) && !deckUnit.unit.special) {
        close++
      }
      if (deckUnit.unit.combats && deckUnit.unit.combats.includes(Combat.Ranged) && !deckUnit.unit.special) {
        ranged++
      }
      if (deckUnit.unit.combats && deckUnit.unit.combats.includes(Combat.Siege) && !deckUnit.unit.special) {
        siege++
      }

      if (deckUnit.unit.hero) {
        heroes++
      }
      if (deckUnit.unit.special) {
        specials++
      }
      if (deckUnit.unit.strength !== undefined && deckUnit.unit.strength !== null) {
        strengthTotal += deckUnit.unit.strength
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
