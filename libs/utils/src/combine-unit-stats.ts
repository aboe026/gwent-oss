import { UnitStats } from '@gwent-oss/graphql-schema/resolver-typings'

/**
 * Combine the statistics of two different unit sets.
 *
 * @param firstStats The first set of statistics to combine.
 * @param secondStats The second set of statistics to combine.
 * @returns A new set of statistics that is a combination of the two inputted unit sets.
 */
export default function combineUnitStats(firstStats: UnitStats, secondStats: UnitStats): UnitStats {
  const weightedAverage =
    (firstStats.strengthAverage * firstStats.units + secondStats.strengthAverage * secondStats.units) /
    (firstStats.units + secondStats.units)
  return {
    agile: firstStats.agile + secondStats.agile,
    close: firstStats.close + secondStats.close,
    avenger: firstStats.avenger + secondStats.avenger,
    berserker: firstStats.berserker + secondStats.berserker,
    bond: firstStats.bond + secondStats.bond,
    decoy: firstStats.decoy + secondStats.decoy,
    horn: firstStats.horn + secondStats.horn,
    mardroeme: firstStats.mardroeme + secondStats.mardroeme,
    medic: firstStats.medic + secondStats.medic,
    morale: firstStats.morale + secondStats.morale,
    muster: firstStats.muster + secondStats.muster,
    scorch: firstStats.scorch + secondStats.scorch,
    spy: firstStats.spy + secondStats.spy,
    weather: firstStats.weather + secondStats.weather,
    ranged: firstStats.ranged + secondStats.ranged,
    siege: firstStats.siege + secondStats.siege,
    heroes: firstStats.heroes + secondStats.heroes,
    specials: firstStats.specials + secondStats.specials,
    strengthAverage: weightedAverage,
    strengthTotal: firstStats.strengthTotal + secondStats.strengthTotal,
    strengths: firstStats.strengths + secondStats.strengths,
    units: firstStats.units + secondStats.units,
  }
}
