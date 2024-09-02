import { Document, FindOptions, ObjectId } from 'mongodb'

import { DeckDbObject, UnitStats } from '@gwent/graphql-schema/database-typings'
import { getLogger } from 'log4js'
import Store from './store'

/**
 * Factory for Gwent decks a user creates.
 */
export default class DeckStore extends Store {
  static readonly COLLECTION_NAME = 'decks'
  private static logger = getLogger('deck-store')

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
    const deck: Document = {
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
        DeckStore.logger.error(message)
        throw Error(message)
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
    return DeckStore.read<DeckDbObject[]>({
      filter: {
        user: new ObjectId(userId),
      },
    })
  }

  /**
   * Get decks for the given IDs
   *
   * @param ids The ObjectIds of the decks to retrieve
   * @returns The decks of the given IDs
   */
  static async getById({
    id,
    options,
  }: {
    id: ObjectId | string
    options?: FindOptions
  }): Promise<DeckDbObject | undefined> {
    const decks = await DeckStore.read<DeckDbObject[]>({
      filter: {
        _id: new ObjectId(id),
      },
      options,
    })
    // TODO: throw error if multiple returned?
    if (decks && decks.length > 0) {
      return decks[0]
    }
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
