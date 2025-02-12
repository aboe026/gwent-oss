import { Document, Filter, ObjectId, UpdateFilter } from 'mongodb'
import { getLogger } from 'log4js'

import { FactionDbObject, FactionKey, UnitStats } from '@gwent/graphql-schema/database-typings'
import PresentableError from '../../util/presentable-error'
import Store from './store'

/**
 * Factory for possible factions Gwent resources can belong to.
 */
export default class FactionStore extends Store {
  static readonly COLLECTION_NAME = 'factions'
  private static logger = getLogger('FactionStore')

  /**
   * Adds a Faction to the database.
   *
   * @param {Object} faction The Faction to add.
   * @param faction.ability The potential Ability the Faction possesses.
   * @param faction.dlc The potential DLC that the Faction was added in.
   * @param faction.image The image for the Faction.
   * @param faction.key The key the Faction corresponds to.
   * @param faction.name The name of the Faction to add.
   * @returns The Faction database document.
   */
  static async add({ ability, dlc, image, key, name }: AddFactionInput): Promise<FactionDbObject> {
    FactionStore.logger.debug(`Adding faction with name "${name}"`)
    const faction: Document = {
      ability,
      created: new Date(),
      dlc: dlc && new ObjectId(dlc),
      image,
      key,
      name,
    }
    if (FactionStore.logger.isTraceEnabled()) {
      FactionStore.logger.trace(`Adding faction: "${JSON.stringify(faction)}"`)
    }
    return FactionStore.create<FactionDbObject>(faction)
  }

  /**
   * Update a faction.
   *
   * @param options The options for the update.
   * @param options.id The ObjectId of the faction to update.
   * @param options.stats The new stats to replace on the faction.
   * @returns The updated faction database document.
   */
  static async edit({ id, stats }: EditFactionInput): Promise<FactionDbObject> {
    FactionStore.logger.debug(`Editing faction with id "${id}"`)
    const filter: Filter<Document> = {
      _id: new ObjectId(id),
    }
    const update: UpdateFilter<Document> = {
      $set: {
        stats,
      },
    }
    if (FactionStore.logger.isTraceEnabled()) {
      FactionStore.logger.trace(`edit filter for ID "${id}": "${JSON.stringify(filter)}"`)
      FactionStore.logger.trace(`edit update for ID "${id}": "${JSON.stringify(update)}"`)
    }
    return FactionStore.update({
      filter,
      update,
    })
  }

  /**
   * Get possible Factions a resource can be apart of.
   *
   * @param options The options to scope the Factions to.
   * @param options.ids The ObjectIds to scope the Factions to.
   * @param options.keys The keys to scope the Factions to.
   * @returns Factions for resources.
   */
  static async get({ ids, keys }: GetFactionsInput): Promise<FactionDbObject[]> {
    if (FactionStore.logger.isDebugEnabled()) {
      FactionStore.logger.debug(`Getting faction with ids "${JSON.stringify(ids)}" and keys "${JSON.stringify(keys)}"`)
    }
    const filter: Filter<Document> = {}
    if (ids) {
      filter._id = {
        $in: ids.map((id) => new ObjectId(id)),
      }
    }
    if (keys) {
      filter.key = {
        $in: keys,
      }
    }
    if (FactionStore.logger.isTraceEnabled()) {
      FactionStore.logger.trace(`get filter: "${JSON.stringify(filter)}"`)
    }
    return FactionStore.read<FactionDbObject[]>({ filter })
  }

  static async getByKey({ key, logPrefix }: { key: FactionKey; logPrefix: string }): Promise<FactionDbObject> {
    const factions = await FactionStore.get({
      keys: [key],
    })
    if (this.logger.isTraceEnabled()) {
      this.logger.trace(`${logPrefix} factions: "${JSON.stringify(factions)}"`)
    }
    if (!factions || factions.length === 0) {
      const message = `Could not find faction with key "${key}".`
      this.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    if (factions.length > 1) {
      const message = `Found more than 1 faction with key "${key}"`
      this.logger.error(`${logPrefix} failed: ${message}: "${JSON.stringify(factions)}"`)
      throw new PresentableError(message)
    }
    const faction = factions[0]
    if (faction.key !== key) {
      const message = `Faction key of "${factions[0].key}" does not match requestd key of "${key}".`
      this.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    return faction
  }
}

export interface AddFactionInput {
  ability: string | null
  dlc: ObjectId | string | null
  image: string
  key: FactionKey
  name: string
}

export interface EditFactionInput {
  id: string | ObjectId
  stats: UnitStats
}

export interface GetFactionsInput {
  ids?: (string | ObjectId)[]
  keys?: FactionKey[]
}
