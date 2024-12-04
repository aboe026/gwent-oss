import { Document, Filter, FindOptions, ObjectId, UpdateFilter } from 'mongodb'
import { getLogger } from 'log4js'

import { DeckDbObject, DeckUnitDbObject, GameDbObject, RedrawDbObject } from '@gwent/graphql-schema/database-typings'
import { MAX_ROUNDS } from '@gwent/constants'
import Store from './store'

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
   * @param game.opponentIds The ObjectId of opponents involved in the game.
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

  /**
   * Get a game from the database if it exists.
   *
   * @param config The configuration of how to query for the game.
   * @param config.id The ObjectID of the game to get.
   * @param config.options Any options to add to the query for the game.
   * @returns The game database document if it exists, undefined otherwise.
   * @throws Error if more than 1 game found.
   */
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

  /**
   * Set the deck to use for playing a given game.
   *
   * @param config The configuration of what deck to set.
   * @param config.deck The deck database object to set for the game.
   * @param gameId The ID of the game to set the deck for.
   * @param hand The starting hand for the game based on the deck chosen.
   * @param undrawn The units in the deck which are not part of the hand.
   * @param userId The ID of the user who owns the game and deck.
   * @returns The game database object with set deck.
   */
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

  /**
   * Set the oder of player turns in a deck.
   *
   * @param config The configuration to use for setting the order.
   * @param config.gameId The ID of the game to set the order for.
   * @param config.userIds The IDs of the users to set the order for, in the order they are in the array.
   * @returns The updated game with the turn orders set.
   */
  static async setOrder({
    gameId,
    userIds,
  }: {
    gameId: string | ObjectId
    userIds: (string | ObjectId)[]
  }): Promise<GameDbObject | undefined> {
    if (GameStore.logger.isDebugEnabled()) {
      GameStore.logger.debug(`Setting order on game "${gameId}" to "${JSON.stringify(userIds)}"`)
    }
    const filter: Filter<Document> = {
      _id: new ObjectId(gameId),
      turn: null,
    }
    const arrayFilters: Document[] = []
    const update: UpdateFilter<Document> = {
      $set: {
        updated: new Date(),
        turn: new ObjectId(userIds[0]),
      },
    }
    if (update.$set) {
      for (let i = 0; i < userIds.length; i++) {
        update.$set[`players.$[p${i}].order`] = i
        arrayFilters.push({
          [`p${i}.user`]: new ObjectId(userIds[i]),
        })
      }
    }
    if (GameStore.logger.isTraceEnabled()) {
      GameStore.logger.trace(`setOrder filter: "${JSON.stringify(filter)}"`)
      GameStore.logger.trace(`setOrder update: "${JSON.stringify(update)}"`)
      GameStore.logger.trace(`setOrder arrayFilters: "${JSON.stringify(arrayFilters)}"`)
    }
    return GameStore.update<GameDbObject>({
      filter,
      update,
      options: {
        arrayFilters,
      },
      verifyExistence: false,
    })
  }

  /**
   * Redraw the unit in a hand of a given game deck.
   *
   * @param config The configuration of the unit to redraw.
   * @param config.currentRedraws The current redraws the game has (before redraw), used to prevent overwrites due to race conditions.
   * @param config.gameId The ID of the game to redraw the unit on.
   * @param config.newHand The new hand the user should have on the game due to the effects of the redraw.
   * @param config.newRedraws The new redraws the user should have on the game, including the current one.
   * @param config.newUndrawn The new undrawn units the user should have on the game, including the unit that was redrawn.
   * @param userId The ID of the user who owns the game to redraw the unit on.
   * @returns The Game database document updated with the redrawn unit.
   */
  static async redraw({
    currentRedraws,
    gameId,
    newHand,
    newRedraws,
    newUndrawn,
    userId,
  }: {
    currentRedraws: RedrawDbObject[]
    gameId: string | ObjectId
    newHand: DeckUnitDbObject[]
    newRedraws: RedrawDbObject[]
    newUndrawn: DeckUnitDbObject[]
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

  /**
   * Mark a game as ready for a user.
   *
   * @param config The configuration of the game to mark as ready.
   * @param config.gameId The ID of the game to mark as ready.
   * @param config.user The ID of the user to mark as ready on the game.
   * @returns The Game database document updated with the ready player.
   */
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
