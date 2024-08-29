import { FactionDbObject, UnitStats } from '@gwent/graphql-schema/database-typings'
import { Dlc, Faction, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import { DlcResolver } from './dlc-resolver'
import FactionStore from '../../database/stores/faction-store'
import { ObjectId } from 'mongodb'
import { getUniqueItems } from '@gwent/utils'

export default class FactionResolver {
  static async resolveFromObject({
    dlc,
    faction,
    neutral,
    neutralStats,
  }: {
    dlc?: Dlc | null
    faction: FactionDbObject
    neutral?: FactionDbObject
    neutralStats?: boolean
  }): Promise<Faction> {
    if (neutralStats && !neutral) {
      neutral = (
        await FactionStore.get({
          keys: [FactionKey.Neutral],
        })
      )[0]
    }
    return {
      created: faction.created,
      id: faction._id.toString(),
      image: faction.image,
      key: faction.key as FactionKey,
      name: faction.name,
      stats: FactionResolver.resolveStats({
        faction,
        neutral: neutralStats ? neutral : undefined,
      }),
      ability: faction.ability,
      dlc: dlc || (await DlcResolver.resolveFromId(faction.dlc)),
    }
  }

  static async resolveFromId({
    id,
    neutrals,
  }: {
    id: ObjectId | string
    neutrals?: boolean
  }): Promise<Faction | undefined> {
    const factions = await FactionResolver.resolveFromIds({
      ids: [id],
      neutralStats: neutrals,
    })
    if (factions && factions.length > 0) {
      return factions[0]
    }
  }

  static async resolveFromIds({
    ids,
    neutralStats,
  }: {
    ids: (ObjectId | string)[]
    neutralStats?: boolean
  }): Promise<Faction[]> {
    if (ids.length === 0) {
      return []
    }
    const factions = await FactionStore.get({
      ids: ids,
    })

    return FactionResolver.resolveFromArray({
      factions,
      neutralStats,
    })
  }

  static async resolveFromArray({
    factions,
    neutralStats,
  }: {
    factions: FactionDbObject[]
    neutralStats?: boolean
  }): Promise<Faction[]> {
    const dlcIds = getUniqueItems<ObjectId>(factions.map((faction) => faction.dlc))
    const dlcs = await DlcResolver.resolveFromIds(dlcIds)

    let neutral: FactionDbObject | undefined = undefined
    if (neutralStats) {
      neutral = factions.find((faction) => faction.key === FactionKey.Neutral)
      if (!neutral) {
        neutral = (
          await FactionStore.get({
            keys: [FactionKey.Neutral],
          })
        )[0]
      }
    }

    const resolvedFactions: Faction[] = []
    for (const faction of factions) {
      let dlc: Dlc | undefined
      if (faction.dlc) {
        dlc = dlcs.find((dlc) => dlc.id.toString() === faction.dlc?.toString())
      }
      resolvedFactions.push(
        await FactionResolver.resolveFromObject({
          faction,
          dlc,
          neutral,
          neutralStats,
        })
      )
    }
    return resolvedFactions
  }

  static resolveStats({
    faction,
    neutral,
  }: {
    faction: FactionDbObject
    neutral?: FactionDbObject | undefined
  }): UnitStats {
    if (!neutral || faction.key === FactionKey.Neutral) {
      return faction.stats
    }
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
}
