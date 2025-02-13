import { Document, Filter, FindOptions, ObjectId } from 'mongodb'
import { getLogger } from 'log4js'

import { LeaderDbObject } from '@gwent/graphql-schema/database-typings'
import PresentableError from '../../util/presentable-error'
import Store from './store'

/**
 * Factory for possible Gwent leaders a user can set for their decks.
 */
export default class LeaderStore extends Store {
  static readonly COLLECTION_NAME = 'leaders'
  private static logger = getLogger('LeaderStore')

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
    LeaderStore.logger.debug(`Adding leader with name "${name}"`)
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
    if (LeaderStore.logger.isDebugEnabled()) {
      LeaderStore.logger.debug(
        `Getting leaders by factions "${JSON.stringify(factionIds)}" and ids "${JSON.stringify(ids)}"`
      )
    }
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
    const options: FindOptions<Document> = {
      collation: {
        locale: 'en', // allows for case-insensitivity
      },
      sort: {
        name: 1,
        _id: 1,
      },
    }
    if (LeaderStore.logger.isTraceEnabled()) {
      LeaderStore.logger.trace(`get filter: "${JSON.stringify(filter)}"`)
      LeaderStore.logger.trace(`get options: "${JSON.stringify(options)}"`)
    }
    return LeaderStore.read<LeaderDbObject[]>({
      filter,
      options,
    })
  }

  /**
   * Gets a leader with the given ID.
   *
   * @param config The configuration used to get the leader.
   * @param config.id The MongoDB ObjectId of the leader to get.
   * @param config.logPrefix The prefix to prepend to log statements.
   * @returns The leader with the given ID.
   * @throws PresentableError if there is a problem getting the leader.
   */
  static async getById({ id, logPrefix }: { id: string | ObjectId; logPrefix: string }): Promise<LeaderDbObject> {
    const leaders = await LeaderStore.get({
      ids: [id],
    })
    if (this.logger.isTraceEnabled()) {
      this.logger.trace(`${logPrefix} leaders: "${JSON.stringify(leaders)}"`)
    }
    if (!leaders || leaders.length === 0) {
      const message = `Could not find leader with ID "${id}".`
      this.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    if (leaders.length > 1) {
      const message = `Found more than 1 leader with ID "${id}"`
      this.logger.error(`${logPrefix} failed: ${message}: "${JSON.stringify(leaders)}"`)
      throw new PresentableError(message)
    }
    const leader = leaders[0]
    if (leader._id.toString() !== id.toString()) {
      const message = `Leader ID of "${leader._id}" does not match requestd ID of "${id}".`
      this.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    return leader
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
