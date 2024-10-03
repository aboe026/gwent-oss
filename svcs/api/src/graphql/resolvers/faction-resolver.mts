import log4js from 'log4js'
import { ObjectId } from 'mongodb'

import { Dlc, Faction, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import DlcResolver from './dlc-resolver.mjs'
import { FactionDbObject, UnitStats } from '@gwent/graphql-schema/database-typings'
import FactionStore from '../../database/stores/faction-store.mjs'
import { getUniqueItems } from '@gwent/utils'
import Verifier from '../../util/verifier.mjs'

/**
 * A class to convert Faction database objects to their GraphQL equivalent.
 */
export default class FactionResolver {
  private static logger = log4js.getLogger('faction-resolver')

  /**
   * Converts a single Faction database object to a single Faction GraphQL object.
   *
   * @param config The configuration used to convert the Faction.
   * @param config.dlc The resolved DLC for the Faction. If not provided, will be retrieved.
   * @param config.faction The Faction to convert.
   * @param config.neutral The Neutral Faction database document to use for calculating stats if neutralStats is true. If not provided, will be retrieved.
   * @param config.neutralStats Whether or not to account for the Neutral faction when calculating the stats of the Faction.
   * @returns The resolved Faction object matching its GraphQL schema definition.
   */
  static async fromObject({
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
      const neutralFactions = await FactionStore.get({
        keys: [FactionKey.Neutral],
      })
      Verifier.checkObjects({
        expectedKeys: [FactionKey.Neutral],
        objects: neutralFactions,
        field: 'key',
        logger: FactionResolver.logger,
        label: 'factions',
      })
      neutral = neutralFactions[0]
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
      dlc: faction.dlc && (dlc || (await DlcResolver.fromId(faction.dlc))),
    }
  }

  /**
   * Retrieves a Faction with the given ID and converts it to the GraphQL object equivalent.
   *
   * @param id The ObjectID of the Faction to convert.
   * @returns The resolved Faction object with the given ID.
   * @throws Error if a Faction with the given ID does not exist.
   */
  static async fromId({ id, neutrals }: { id: ObjectId | string; neutrals?: boolean }): Promise<Faction> {
    const factions = await FactionResolver.fromIds({
      ids: [id],
      neutralStats: neutrals,
    })
    return factions && factions[0]
  }

  /**
   * Retrieves Factions with the given IDs and converts them to their GraphQL object equivalents.
   *
   * @param ids The ObjectIDs of the Factions to convert.
   * @returns The resolved Factions array for the given IDs.
   * @throws Error if a Faction with the given IDs does not exist.
   */
  static async fromIds({
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

    Verifier.checkObjects({
      expectedKeys: ids,
      objects: factions,
      field: '_id',
      logger: FactionResolver.logger,
      label: 'factions',
    })

    return FactionResolver.fromArray({
      factions,
      neutralStats,
    })
  }

  /**
   * Converts an array of Faction database objects to an array of Faction GraphQL objects.
   *
   * @param config The configuration used to convert the array.
   * @param config.factions The array of Faction database objects to convert.
   * @param config.neutralStats Whether or not to account for the Neutral faction when calculating the stats of the Factions.
   * @returns The resolved Faction array matching the GraphQL schema definition.
   */
  static async fromArray({
    factions,
    neutralStats,
  }: {
    factions: FactionDbObject[]
    neutralStats?: boolean
  }): Promise<Faction[]> {
    const dlcIds = getUniqueItems<ObjectId>(factions.map((faction) => faction.dlc))
    const dlcs = await DlcResolver.fromIds(dlcIds)

    let neutral: FactionDbObject | undefined = undefined
    if (neutralStats) {
      neutral = factions.find((faction) => faction.key === FactionKey.Neutral)
      if (!neutral) {
        const neutralFactions = await FactionStore.get({
          keys: [FactionKey.Neutral],
        })
        Verifier.checkObjects({
          expectedKeys: [FactionKey.Neutral],
          objects: neutralFactions,
          field: 'key',
          logger: FactionResolver.logger,
          label: 'factions',
        })
        neutral = neutralFactions[0]
      }
    }

    const resolvedFactions: Faction[] = []
    for (const faction of factions) {
      resolvedFactions.push(
        await FactionResolver.fromObject({
          faction,
          dlc: faction.dlc && dlcs.find((dlc) => dlc.id.toString() === faction.dlc?.toString()),
          neutral,
          neutralStats,
        })
      )
    }
    return resolvedFactions
  }

  /**
   * Calculate the statistics for Units in the faction.
   *
   * @param config The configuration used to calculate the statistics.
   * @param config.faction The Faction database object to calculate Unit statistics for.
   * @param config.neutral Whether or not to include Neutral Faction Units when calculating statistics for the Faction.
   * @returns The statistics for the Units in the Faction.
   */
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
