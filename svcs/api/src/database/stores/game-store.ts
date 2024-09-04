import { Document, FindOptions, ObjectId } from 'mongodb'

import { DeckDbObject, DeckUnitDbObject, GameDbObject, RedrawDbObject } from '@gwent/graphql-schema/database-typings'
import { getLogger } from 'log4js'
import Store from './store'
import { MAX_ROUNDS } from '@gwent/constants'

/**
 * Factory for Gwent games a user creates.
 */
export default class GameStore extends Store {
  static readonly COLLECTION_NAME = 'games'
  private static logger = getLogger('game-store')

  /**
   * Adds a game for users to play in the database.
   *
   * @param game The game to add.
   * @param game.creatorId The ObjectId of the user who is creating the game.
   * @param game.opponentIds The opponents involved in the game.
   * @returns The game database document.
   */
  static async add({ creatorId, opponentIds }: AddGameInput): Promise<GameDbObject> {
    const created = new Date()
    const playerIds = [creatorId, ...opponentIds]
    const game: Document = {
      created,
      creator: new ObjectId(creatorId),
      players: playerIds.map((playerId) => {
        return {
          deck: {
            discard: [],
            from: null,
            hand: [],
            redraws: [],
            undrawn: [],
          },
          ready: false,
          rounds: [],
          user: new ObjectId(playerId),
        }
      }),
      round: {
        current: 0,
        maximum: MAX_ROUNDS,
      },
      updated: created,
      victors: [],
    }
    if (GameStore.logger.isTraceEnabled()) {
      GameStore.logger.trace(`Adding game: "${JSON.stringify(game)}"`)
    }
    return GameStore.create<GameDbObject>(game)
  }

  static async getById({
    id,
    options,
  }: {
    id: string | ObjectId
    options?: FindOptions
  }): Promise<GameDbObject | undefined> {
    const result = await GameStore.read<GameDbObject[]>({
      filter: {
        _id: new ObjectId(id),
      },
      options,
    })
    if (result && result.length > 1) {
      const message = `Multiple games with ID "${id}" found.`
      GameStore.logger.error(message)
      throw Error(message)
    }
    return result && result[0]
  }

  /**
   * Get all games a user is apart of.
   *
   * @param userId The user ObjectId to scope games to.
   * @returns All games a user is apart of.
   */
  static async getByUserId(userId: string | ObjectId): Promise<GameDbObject[]> {
    return GameStore.read<GameDbObject[]>({
      filter: {
        'players.user': new ObjectId(userId),
      },
    })
  }

  static async setDeck({
    deck,
    gameId,
    hand,
    undrawn,
    userId,
  }: {
    deck: DeckDbObject
    gameId: string | ObjectId
    hand: DeckUnitDbObject[]
    undrawn: DeckUnitDbObject[]
    userId: string | ObjectId
  }): Promise<GameDbObject | undefined> {
    if (GameStore.logger.isTraceEnabled()) {
      GameStore.logger.trace(
        `Setting deck to "${deck._id}" on game "${gameId}" for user "${userId}" with hand "${JSON.stringify(hand)}"`
      )
    }
    return GameStore.update<GameDbObject>({
      filter: {
        _id: new ObjectId(gameId),
        'players.user': new ObjectId(userId),
        'players.deck.from': null,
      },
      update: {
        $set: {
          updated: new Date(),
          'players.$.deck.from': deck,
          'players.$.deck.hand': hand,
          'players.$.deck.undrawn': undrawn,
        },
      },
      verifyExistence: false,
    })
  }

  static async redraw({
    currentRedraws,
    newHand,
    newRedraws,
    newUndrawn,
    gameId,
    userId,
  }: {
    currentRedraws: RedrawDbObject[]
    newHand: DeckUnitDbObject[]
    newRedraws: RedrawDbObject[]
    newUndrawn: DeckUnitDbObject[]
    gameId: string | ObjectId
    userId: string | ObjectId
  }): Promise<GameDbObject | undefined> {
    const { from, to } = newRedraws[newRedraws.length - 1]
    if (GameStore.logger.isTraceEnabled()) {
      GameStore.logger.trace(
        `Redrawing unit from "${from.unit}" to "${to.unit}" on game "${gameId}" for user "${userId}"`
      )
    }
    return GameStore.update<GameDbObject>({
      filter: {
        _id: new ObjectId(gameId),
        'players.user': new ObjectId(userId),
        'players.ready': false,
        'players.deck.redraws': currentRedraws,
      },
      update: {
        $set: {
          updated: new Date(),
          'players.$.deck.hand': newHand,
          'players.$.deck.undrawn': newUndrawn,
          'players.$.deck.redraws': newRedraws,
        },
      },
      verifyExistence: false,
    })
  }

  static async setReady({
    gameId,
    userId,
  }: {
    gameId: ObjectId | string
    userId: ObjectId | string
  }): Promise<GameDbObject | undefined> {
    if (GameStore.logger.isTraceEnabled()) {
      GameStore.logger.trace(`Marking game "${gameId}" ready for user "${userId}"`)
    }
    return GameStore.update<GameDbObject>({
      filter: {
        _id: new ObjectId(gameId),
        'players.user': new ObjectId(userId),
        'players.ready': false,
      },
      update: {
        $set: {
          updated: new Date(),
          'players.$.ready': true,
        },
      },
      verifyExistence: false,
    })
  }
}

export interface AddGameInput {
  creatorId: ObjectId | string
  opponentIds: (ObjectId | string)[]
}
