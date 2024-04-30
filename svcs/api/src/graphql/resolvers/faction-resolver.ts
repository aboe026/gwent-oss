import { FactionDbObject, FactionKey } from '@gwent/graphql-schema/database-typings'
import { FactionResolvers } from '@gwent/graphql-schema/resolver-typings'
import FactionStore from '../../database/stores/faction-store'
import { resolveDlc } from './resolver-util'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FactionResolver: FactionResolvers<any, FactionDbObject> = {
  dlc: async (faction: FactionDbObject) => resolveDlc(faction),
  id: (faction: FactionDbObject) => faction._id.toString(),
  stats: async (faction: FactionDbObject, args) => {
    if (args.neutrals && faction.key !== FactionKey.Neutral) {
      const factions = await FactionStore.get({
        keys: [FactionKey.Neutral],
      })
      const neutral = factions[0]
      const weightedAverage =
        (faction.stats.strengthAverage * faction.stats.units + neutral.stats.strengthAverage * neutral.stats.units) /
        (faction.stats.units + neutral.stats.units)
      return {
        agile: faction.stats.agile + neutral.stats.agile,
        close: faction.stats.close + neutral.stats.close,
        avenger: faction.stats.avenger + neutral.stats.avenger,
        berserker: faction.stats.berserker + neutral.stats.berserker,
        bond: faction.stats.bond + neutral.stats.bond,
        decoy: faction.stats.decoy + neutral.stats.decoy,
        horn: faction.stats.horn + neutral.stats.horn,
        mardroeme: faction.stats.mardroeme + neutral.stats.mardroeme,
        medic: faction.stats.medic + neutral.stats.medic,
        morale: faction.stats.morale + neutral.stats.morale,
        muster: faction.stats.muster + neutral.stats.muster,
        scorch: faction.stats.scorch + neutral.stats.scorch,
        spy: faction.stats.spy + neutral.stats.spy,
        weather: faction.stats.weather + neutral.stats.weather,
        ranged: faction.stats.ranged + neutral.stats.ranged,
        siege: faction.stats.siege + neutral.stats.siege,
        heroes: faction.stats.heroes + neutral.stats.heroes,
        specials: faction.stats.specials + neutral.stats.specials,
        strengthAverage: weightedAverage,
        strengthTotal: faction.stats.strengthTotal + neutral.stats.strengthTotal,
        strengths: faction.stats.strengths + neutral.stats.strengths,
        units: faction.stats.units + neutral.stats.units,
      }
    }
    return faction.stats
  },
}

export default FactionResolver
