import { Document, Filter, ObjectId } from 'mongodb'
import { getLogger } from 'log4js'

import { FactionDbObject, FactionKey, UnitStats } from '@gwent/graphql-schema/database-typings'
import Store from './store'

/**
 * Factory for possible factions Gwent resources can belong to.
 */
export default class FactionStore extends Store {
  static readonly COLLECTION_NAME = 'factions'
  private static logger = getLogger('faction-store')

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
  static async edit({ id, stats }: { id: string | ObjectId; stats: UnitStats }): Promise<FactionDbObject> {
    return FactionStore.update({
      filter: {
        _id: new ObjectId(id),
      },
      update: {
        $set: {
          stats,
        },
      },
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
    return FactionStore.read<FactionDbObject[]>({ filter })
  }
}

export interface AddFactionInput {
  ability: string | null
  dlc: ObjectId | string | null
  image: string
  key: FactionKey
  name: string
}

export interface GetFactionsInput {
  ids?: (string | ObjectId)[]
  keys?: FactionKey[]
}
