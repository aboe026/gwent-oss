import { Document, Filter, FindOptions, ObjectId, WithoutId } from 'mongodb'

import { DeckDbObject, UnitStats } from '@gwent/graphql-schema/database-typings'
import { getLogger } from 'log4js'
import Store from './store'

/**
 * Factory for Gwent decks a user creates.
 */
export default class DeckStore extends Store {
  static readonly COLLECTION_NAME = 'decks'
  private static logger = getLogger('DeckStore')

  /**
   * Adds a deck for a user to the database.
   *
   * @param deck The deck to add.
   * @param deck.factionId The Faction of the deck.
   * @param deck.leaderId The ObjectId of the leader for the deck.
   * @param deck.name The name of the deck.
   * @param deck.stats The statistics of the deck.
   * @param deck.units The units ObjectId and their art style for the deck.
   * @param deck.userId The ObjectId of the user creating the deck.
   * @returns The deck databased document.
   */
  static async add({ factionId, leaderId, name, stats, units, userId }: AddDeckInput): Promise<DeckDbObject> {
    DeckStore.logger.debug(`Adding deck named "${name}" for user "${userId}"`)
    const deck: WithoutId<DeckDbObject> = {
      created: new Date(),
      faction: new ObjectId(factionId),
      leader: new ObjectId(leaderId),
      name,
      stats,
      units: units.map((unit) => {
        return {
          artStyle: unit.artStyle,
          unit: new ObjectId(unit.unit),
        }
      }),
      user: new ObjectId(userId),
    }
    if (DeckStore.logger.isTraceEnabled()) {
      DeckStore.logger.trace(`Adding deck: "${JSON.stringify(deck)}"`)
    }
    try {
      return await DeckStore.create<DeckDbObject>(deck)
    } catch (err: unknown) {
      if (
        DeckStore.isMongoError({
          error: err,
          code: 11000,
        })
      ) {
        const message = `Deck with name "${name}" already exists for user "${userId}"`
        DeckStore.logger.warn(message)
        throw Error(message, { cause: err })
      } else {
        DeckStore.logger.error(`Error adding deck for user "${userId}": ${err}`)
        throw err
      }
    }
  }

  /**
   * Get all decks a user has created.
   *
   * @param userId The user ObjectId to scope decks to.
   * @returns All decks for a user.
   */
  static async get(userId: string | ObjectId): Promise<DeckDbObject[]> {
    DeckStore.logger.debug(`Getting decks for user "${userId}"`)
    const filter: Filter<Document> = {
      user: new ObjectId(userId),
    }
    if (DeckStore.logger.isTraceEnabled()) {
      DeckStore.logger.trace(`get filter: "${JSON.stringify(filter)}"`)
    }
    return DeckStore.read<DeckDbObject[]>({
      filter,
    })
  }

  /**
   * Get Deck with the given ID.
   *
   * @param config The configuration used to retrieve the Deck.
   * @param config.id The ObjectId of the Deck to retrieve.
   * @param config.options The options to use when retrieving the Deck.
   * @returns The decks of the given IDs.
   * @throws {Error} if more than 1 deck found.
   */
  static async getById({
    id,
    options,
  }: {
    id: ObjectId | string
    options?: FindOptions
  }): Promise<DeckDbObject | undefined> {
    DeckStore.logger.debug(`Getting deck with ID "${id}"`)
    const filter: Filter<Document> = {
      _id: new ObjectId(id),
    }
    if (DeckStore.logger.isTraceEnabled()) {
      DeckStore.logger.trace(`getById filter for ID "${id}": "${JSON.stringify(filter)}"`)
      DeckStore.logger.trace(`getById options for ID "${id}": "${JSON.stringify(options)}"`)
    }
    const decks = await DeckStore.read<DeckDbObject[]>({
      filter,
      options,
    })
    if (decks.length > 1) {
      const message = `Multiple decks with ID "${id}" found`
      DeckStore.logger.error(`${message}: "${JSON.stringify(decks)}"`)
      throw Error(`${message}.`)
    }
    return decks && decks[0]
  }
}

export interface AddDeckInput {
  name: string
  userId: string | ObjectId
  factionId: string | ObjectId
  leaderId: string | ObjectId
  stats: UnitStats
  units: AddDeckUnitInput[]
}

export interface AddDeckUnitInput {
  artStyle: number
  unit: string | ObjectId
}
