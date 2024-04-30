import { Combat, DeckCard, UnitStats, EffectKey } from '@gwent/graphql-schema/resolver-typings'

/**
 * Returns the statistics for the set of cards.
 *
 * @param cards The set of cards to get statistics for.
 * @returns The statistics for the set of cards.
 */
export default function getUnitStats(cards: DeckCard[]): UnitStats {
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

  for (const card of cards) {
    if (card.unit.deckable) {
      if (card.unit.effects?.map((effect) => effect.key).includes(EffectKey.Agile)) {
        agile++
      }
      if (card.unit.effects?.map((effect) => effect.key).includes(EffectKey.Avenger)) {
        avenger++
      }
      if (card.unit.effects?.map((effect) => effect.key).includes(EffectKey.Berserker)) {
        berserker++
      }
      if (card.unit.effects?.map((effect) => effect.key).includes(EffectKey.Bond)) {
        bond++
      }
      if (card.unit.effects?.map((effect) => effect.key).includes(EffectKey.Decoy)) {
        decoy++
      }
      if (card.unit.effects?.map((effect) => effect.key).includes(EffectKey.Horn)) {
        horn++
      }
      if (card.unit.effects?.map((effect) => effect.key).includes(EffectKey.Mardroeme)) {
        mardroeme++
      }
      if (card.unit.effects?.map((effect) => effect.key).includes(EffectKey.Medic)) {
        medic++
      }
      if (card.unit.effects?.map((effect) => effect.key).includes(EffectKey.Morale)) {
        morale++
      }
      if (card.unit.effects?.map((effect) => effect.key).includes(EffectKey.Muster)) {
        muster++
      }
      if (card.unit.effects?.map((effect) => effect.key).includes(EffectKey.Scorch)) {
        scorch++
      }
      if (card.unit.effects?.map((effect) => effect.key).includes(EffectKey.Spy)) {
        spy++
      }
      if (card.unit.effects?.map((effect) => effect.key).includes(EffectKey.Weather)) {
        weather++
      }

      if (card.unit.combats && card.unit.combats.includes(Combat.Close) && !card.unit.special) {
        close++
      }
      if (card.unit.combats && card.unit.combats.includes(Combat.Ranged) && !card.unit.special) {
        ranged++
      }
      if (card.unit.combats && card.unit.combats.includes(Combat.Siege) && !card.unit.special) {
        siege++
      }

      if (card.unit.hero) {
        heroes++
      }
      if (card.unit.special) {
        specials++
      }
      if (card.unit.strength !== undefined && card.unit.strength !== null) {
        strengthTotal += card.unit.strength
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
