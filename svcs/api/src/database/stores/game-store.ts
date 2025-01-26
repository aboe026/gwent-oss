import { Document, Filter, FindOptions, ObjectId, UpdateFilter } from 'mongodb'
import { getLogger } from 'log4js'

import {
  DeckDbObject,
  DeckUnitDbObject,
  GameDbObject,
  GamePlayerDbObject,
  RedrawDbObject,
} from '@gwent/graphql-schema/database-typings'
import { STARTING_LIVES } from '@gwent/constants'
import Store from './store'

/**
 * Factory for Gwent games a user creates.
 */
export default class GameStore extends Store {
  static readonly COLLECTION_NAME = 'games'
  private static logger = getLogger('GameStore')

  /**
   * Adds a game for users to play in the database.
   *
   * @param game The game to add.
   * @param game.creatorId The ObjectId of the user who is creating the game.
   * @param game.opponentIds The ObjectId of opponents involved in the game.
   * @returns The game database document.
   */
  static async add({ creatorId, opponentIds }: AddGameInput): Promise<GameDbObject> {
    GameStore.logger.debug(`Adding game by creator "${creatorId}"`)
    const created = new Date()
    const playerIds = [creatorId, ...opponentIds]
    const game: Document = {
      config: {
        lives: STARTING_LIVES,
      },
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
      round: 0,
      updated: created,
      victors: [],
      weather: [],
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
   * @param config.id The ObjectId of the game to get.
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
    GameStore.logger.debug(`Getting game by ID "${id}"`)
    const filter: Filter<Document> = {
      _id: new ObjectId(id),
    }
    if (GameStore.logger.isTraceEnabled()) {
      GameStore.logger.trace(`getById filter for ID "${id}": "${JSON.stringify(filter)}"`)
      GameStore.logger.trace(`getById options for ID "${id}": "${JSON.stringify(options)}"`)
    }
    const result = await GameStore.read<GameDbObject[]>({
      filter,
      options,
    })
    if (result && result.length > 1) {
      const message = `Multiple games with ID "${id}" found`
      GameStore.logger.error(`${message}: "${JSON.stringify(result)}"`)
      throw Error(`${message}.`)
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
    GameStore.logger.debug(`Getting games for userId "${userId}"`)
    const filter: Filter<Document> = {
      'players.user': new ObjectId(userId),
    }
    if (GameStore.logger.isTraceEnabled()) {
      GameStore.logger.trace(`getByUserId filter for userId "${userId}": "${JSON.stringify(filter)}"`)
    }
    return GameStore.read<GameDbObject[]>({
      filter,
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
    if (GameStore.logger.isDebugEnabled()) {
      GameStore.logger.debug(
        `Setting deck to "${deck._id}" on game "${gameId}" for user "${userId}" with hand "${JSON.stringify(
          hand.map((deckUnit) => deckUnit.unit.id)
        )}"`
      )
    }
    const filter: Filter<Document> = {
      _id: new ObjectId(gameId),
      'players.user': new ObjectId(userId),
      'players.deck.from': null,
    }
    const update: UpdateFilter<Document> = {
      $set: {
        updated: new Date(),
        'players.$.deck.from': deck,
        'players.$.deck.hand': hand,
        'players.$.deck.undrawn': undrawn,
      },
    }
    if (GameStore.logger.isTraceEnabled()) {
      GameStore.logger.trace(`setDeck for game "${gameId}" and user "${userId}" filter: "${JSON.stringify(filter)}"`)
      GameStore.logger.trace(`setDeck for game "${gameId}" and user "${userId}" update: "${JSON.stringify(update)}"`)
    }
    return GameStore.update<GameDbObject>({
      filter,
      update,
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
      GameStore.logger.trace(`setOrder for game "${gameId}" filter: "${JSON.stringify(filter)}"`)
      GameStore.logger.trace(`setOrder for game "${gameId}" update: "${JSON.stringify(update)}"`)
      GameStore.logger.trace(`setOrder for game "${gameId}" arrayFilters: "${JSON.stringify(arrayFilters)}"`)
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
    GameStore.logger.debug(
      `Redrawing unit from "${from.unit}" to "${to.unit}" on game "${gameId}" for user "${userId}"`
    )
    const filter: Filter<Document> = {
      _id: new ObjectId(gameId),
      'players.user': new ObjectId(userId),
      'players.ready': false,
      'players.deck.redraws': currentRedraws,
    }
    const update: UpdateFilter<Document> = {
      $set: {
        updated: new Date(),
        'players.$.deck.hand': newHand,
        'players.$.deck.undrawn': newUndrawn,
        'players.$.deck.redraws': newRedraws,
      },
    }
    if (GameStore.logger.isTraceEnabled()) {
      GameStore.logger.trace(`redraw for game "${gameId}" by user "${userId}" filter: "${JSON.stringify(filter)}"`)
      GameStore.logger.trace(`redraw for game "${gameId}" by user "${userId}" update: "${JSON.stringify(update)}"`)
    }
    return GameStore.update<GameDbObject>({
      filter,
      update,
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
    previousUpdate,
    players,
    currentRound,
  }: {
    gameId: ObjectId | string
    userId: ObjectId | string
    previousUpdate: Date
    players: GamePlayerDbObject[]
    currentRound: number
  }): Promise<GameDbObject | undefined> {
    GameStore.logger.debug(`Marking game "${gameId}" ready for user "${userId}"`)
    const filter: Filter<Document> = {
      _id: new ObjectId(gameId),
      updated: previousUpdate,
    }
    const update: UpdateFilter<Document> = {
      $set: {
        updated: new Date(),
        players,
        round: currentRound,
      },
    }
    if (GameStore.logger.isTraceEnabled()) {
      GameStore.logger.trace(`ready for game "${gameId}" by user "${userId}" filter: "${JSON.stringify(filter)}"`)
      GameStore.logger.trace(`ready for game "${gameId}" by user "${userId}" update: "${JSON.stringify(update)}"`)
    }
    return GameStore.update<GameDbObject>({
      filter,
      update,
      verifyExistence: false,
    })
  }

  /**
   * Take a turn for a user on a game.
   *
   * @param config The configuration for the movement to make.
   * @param config.game The Game object with the effects of the movement.
   * @param config.userId The MongoDB ObjectId of the user who is making the movement.
   * @param config.nextTurn The MongoDB ObjectId of the user who is permitted to make the next movement.
   * @returns The updated game database document.
   */
  static async makeMove({
    game,
    userId,
    nextTurn,
  }: {
    game: GameDbObject
    userId: ObjectId | string
    nextTurn?: ObjectId | string
  }): Promise<GameDbObject | undefined> {
    GameStore.logger.debug(`Move made on game "${game._id}" by user "${userId}", setting next move to "${nextTurn}"`)
    const filter: Filter<Document> = {
      _id: game._id,
      turn: new ObjectId(userId),
      updated: game.updated,
    }
    const update: UpdateFilter<Document> = {
      $set: {
        ...game,
        updated: new Date(),
        turn: new ObjectId(nextTurn),
      },
    }
    if (GameStore.logger.isTraceEnabled()) {
      GameStore.logger.trace(`move on game "${game._id}" by user "${userId}" filter: "${JSON.stringify(filter)}"`)
      GameStore.logger.trace(`move on game "${game._id}" by user "${userId}" update: "${JSON.stringify(update)}"`)
    }
    return GameStore.update<GameDbObject>({
      filter,
      update,
      verifyExistence: false,
    })
  }
}

export interface AddGameInput {
  creatorId: ObjectId | string
  opponentIds: (ObjectId | string)[]
}
