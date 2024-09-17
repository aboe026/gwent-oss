import { Document, Filter, ObjectId } from 'mongodb'
import { getLogger } from 'log4js'

import { LeaderDbObject } from '@gwent/graphql-schema/database-typings'
import Store from './store'

/**
 * Factory for possible Gwent leaders a user can set for their decks.
 */
export default class LeaderStore extends Store {
  static readonly COLLECTION_NAME = 'leaders'
  private static logger = getLogger('leader-store')

  /**
   * Add a Leader to the database.
   *
   * @param leader The Leader to add.
   * @param leader.ability The ability the Leader has during gameplay.
   * @param leader.dlc The potential DLC that the Leader was added in.
   * @param leader.faction The faction the Leader belongs to.
   * @param leader.image The image path of the Leader.
   * @param leader.name The name of the Leader.
   * @param leader.quote The quote of the Leader.
   * @returns The Leader database document.
   */
  static async add({ ability, dlc, faction, image, name, quote }: AddLeaderInput): Promise<LeaderDbObject> {
    const leader: Document = {
      ability,
      created: new Date(),
      dlc: dlc && new ObjectId(dlc),
      faction: new ObjectId(faction),
      image,
      name,
      quote,
    }
    if (LeaderStore.logger.isTraceEnabled()) {
      LeaderStore.logger.trace(`Adding leader: "${JSON.stringify(leader)}"`)
    }
    return LeaderStore.create<LeaderDbObject>(leader)
  }

  /**
   * Get possible Leaders a user can set for their deck.
   *
   * @param options The options to scope Leaders to.
   * @param options.factionIds The Faction ObjectIds to scope Leaders to.
   * @param options.ids The ObjectIds to scope Leaders to.
   * @returns Leaders for Decks.
   */
  static async get({ factionIds, ids }: GetLeadersInput): Promise<LeaderDbObject[]> {
    const filter: Filter<Document> = {}
    if (factionIds) {
      filter.faction = {
        $in: factionIds.map((factionId) => new ObjectId(factionId)),
      }
    }
    if (ids) {
      filter._id = {
        $in: ids.map((id) => new ObjectId(id)),
      }
    }
    return LeaderStore.read<LeaderDbObject[]>({
      filter,
      options: {
        collation: {
          locale: 'en', // allows for case-insensitivity
        },
        sort: {
          name: 1,
          _id: 1,
        },
      },
    })
  }
}

export interface AddLeaderInput {
  ability: string
  dlc: ObjectId | string | null
  faction: string | ObjectId
  image: string
  name: string
  quote: string
}

export interface GetLeadersInput {
  factionIds?: (string | ObjectId)[]
  ids?: (string | ObjectId)[]
}
