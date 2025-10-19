import { Document, Filter, FindOptions, ObjectId, UpdateFilter } from 'mongodb'
import { getLogger } from 'log4js'

import { GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
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
      status: GameStatus.Decking,
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
   * @throws {Error} if more than 1 game found.
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
   * Saves a game to the database, automatically incrementing the "updated" field.
   *
   * @param game The game to save to the database.
   * @returns The updated saved game if it exists.
   */
  static async save(game: GameDbObject): Promise<GameDbObject | undefined> {
    const filter: Filter<Document> = {
      _id: game._id,
      updated: game.updated,
    }
    const update: UpdateFilter<Document> = {
      $set: {
        ...game,
        updated: new Date(),
      },
    }
    if (GameStore.logger.isTraceEnabled()) {
      GameStore.logger.trace(`save on game "${game._id}" filter: "${JSON.stringify(filter)}"`)
      GameStore.logger.trace(`save on game "${game._id}" update: "${JSON.stringify(update)}"`)
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
