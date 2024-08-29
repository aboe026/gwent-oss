import { UnitStats } from '@gwent/graphql-schema/resolver-typings'

export default class TestUtil {
  static getStats(offset = 0): UnitStats {
    return {
      agile: 1 + offset,
      avenger: 2 + offset,
      berserker: 3 + offset,
      bond: 4 + offset,
      close: 5 + offset,
      decoy: 6 + offset,
      heroes: 7 + offset,
      horn: 8 + offset,
      mardroeme: 9 + offset,
      medic: 10 + offset,
      morale: 11 + offset,
      muster: 12 + offset,
      ranged: 13 + offset,
      scorch: 14 + offset,
      siege: 15 + offset,
      specials: 16 + offset,
      spy: 17 + offset,
      strengthAverage: 18 + offset,
      strengths: 19 + offset,
      strengthTotal: 20 + offset,
      units: 21 + offset,
      weather: 22 + offset,
    }
  }
}
