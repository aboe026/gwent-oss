import { getLogger } from 'log4js'

import { FactionDbObject, UnitStats } from '@gwent/graphql-schema/database-typings'
import { Dlc, Faction, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import DlcResolver from './dlc-resolver'
import FactionStore from '../../database/stores/faction-store'
import { ObjectId } from 'mongodb'
import { getUniqueItems } from '@gwent/utils'

export default class FactionResolver {
  private static logger = getLogger('faction-resolver')

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
      const factions = await FactionStore.get({
        keys: [FactionKey.Neutral],
      })
      if (factions.length < 1) {
        const message = `Could not resolve faction "${FactionKey.Neutral}" on faction "${faction._id}".`
        FactionResolver.logger.error(message)
        throw Error(message)
      }
      neutral = factions[0]
    }
    let resolvedDlc: Dlc | null = null
    if (faction.dlc) {
      resolvedDlc = dlc || (await DlcResolver.resolveFromId(faction.dlc))
      if (!resolvedDlc) {
        const message = `Could not resolve dlc "${faction.dlc}" on faction "${faction._id}".`
        FactionResolver.logger.error(message)
        throw Error(message)
      }
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
      dlc: resolvedDlc,
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
      verify: false,
    })
    return factions && factions[0]
  }

  static async resolveFromIds({
    ids,
    neutralStats,
    verify = true,
  }: {
    ids: (ObjectId | string)[]
    neutralStats?: boolean
    verify?: boolean
  }): Promise<Faction[]> {
    if (ids.length === 0) {
      return []
    }
    const factions = await FactionStore.get({
      ids: ids,
    })

    if (verify) {
      for (const id of ids) {
        const faction = factions.find((faction) => faction._id.toString() === id.toString())
        if (!faction) {
          const message = `Could not resolve faction "${id}".`
          FactionResolver.logger.error(message)
          throw Error(message)
        }
      }
    }
    if (factions.length !== ids.length) {
      const requestedIds = ids.map((id) => id.toString())
      const extraIds: string[] = []
      for (const faction of factions) {
        const id = faction._id.toString()
        if (!requestedIds.includes(id)) {
          extraIds.push(id)
        }
      }
      const message = `More factions resolved "${JSON.stringify(extraIds)}" than requested "${JSON.stringify(ids)}".`
      FactionResolver.logger.error(message)
      throw Error(message)
    }

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
        const neutralFactions = await FactionStore.get({
          keys: [FactionKey.Neutral],
        })
        if (neutralFactions.length < 1) {
          const message = `Could not resolve neutral faction "${FactionKey.Neutral}" for factions array: None found.`
          FactionResolver.logger.error(message)
          throw Error(message)
        } else if (neutralFactions.length > 1) {
          // TODO: add >1 check to other resolvers
          const message = `Could not resolve neutral faction "${
            FactionKey.Neutral
          }" for factions array: Found more than one: "${JSON.stringify(neutralFactions)}".`
          FactionResolver.logger.error(message)
          throw Error(message)
        }
        neutral = neutralFactions[0]
      }
    }

    const resolvedFactions: Faction[] = []
    for (const faction of factions) {
      let dlc: Dlc | undefined
      if (faction.dlc) {
        dlc = dlcs.find((dlc) => dlc.id.toString() === faction.dlc?.toString())
        if (!dlc) {
          const message = `Could not resolve dlc "${faction.dlc}" for faction ${faction._id} in array.`
          FactionResolver.logger.error(message)
          throw Error(message)
        }
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
