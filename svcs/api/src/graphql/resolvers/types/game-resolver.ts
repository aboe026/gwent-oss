import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Combat, Game, User } from '@gwent/graphql-schema/resolver-typings'
import { GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import GamePlayerResolver from './game-player-resolver'
import GameStore from '../../../database/stores/game-store'
import { getUniqueItems } from '@gwent/utils'
import UserResolver from './user-resolver'
import Verifier from '../../../util/verifier'

/**
 * A class to convert Game database objects to their GraphQL equivalent.
 */
export default class GameResolver {
  private static logger = getLogger('GameResolver')

  /**
   * Converts a single Game database object to a single Game GraphQL object.
   *
   * @param config The configuration used to convert the Game.
   * @param config.creator The resolved User who created the Game. If not provided, will be retrieved.
   * @param config.game The Game to convert.
   * @param config.user The resolved Users for the players on the Game. If not provided, will be retrieved.
   * @returns The resolved Game object matching its GraphQL schema definition.
   */
  static async fromObject({
    creator,
    game,
    users,
  }: {
    game: GameDbObject
    creator?: User
    users?: User[]
  }): Promise<Game> {
    const status = game.status as GameStatus
    const resolvedUsers: User[] = []
    if (creator) {
      resolvedUsers.push(creator)
    }
    if (users) {
      resolvedUsers.push(...users)
    }
    const preResolvedUserIds: string[] = resolvedUsers.map((user) => user.id)
    const userIdsToResolve: string[] = []
    for (const player of game.players) {
      if (!userIdsToResolve.includes(player.user.toString()) && !preResolvedUserIds.includes(player.user.toString())) {
        userIdsToResolve.push(player.user.toString())
      }
    }
    resolvedUsers.push(...(await UserResolver.fromIds(userIdsToResolve)))
    const resolvedPlayers = await GamePlayerResolver.fromArray({
      players: game.players,
      users: resolvedUsers,
      gameStatus: status,
    })

    return {
      config: game.config,
      created: game.created,
      creator: creator || (resolvedUsers?.find((user) => user.id === game.creator.toString()) as User),
      id: game._id.toString(),
      players: resolvedPlayers,
      round: game.round,
      status,
      turn: game.turn && resolvedPlayers.find((player) => player.user.id.toString() === game.turn?.toString()),
      updated: game.updated,
      victors: game.victors.map((victor) => resolvedUsers.find((user) => user.id === victor.toString()) as User),
      weather: game.weather.map((weather) => weather as Combat),
    }
  }

  /**
   * Converts an array of Game database objects to an array of Game GraphQL objects.
   *
   * @param games The Game database documents to convert.
   * @returns The resolved Game array matching the GraphQL schema definition.
   */
  static async fromArray(games: GameDbObject[]): Promise<Game[]> {
    const userIds = getUniqueItems<string>(games.map((game) => game.creator.toString()))

    for (const game of games) {
      for (const player of game.players) {
        const userId = player.user.toString()
        if (!userIds.includes(userId)) {
          userIds.push(userId)
        }
      }
    }

    const users = await UserResolver.fromIds(userIds)

    const resolvedGames: Game[] = []
    for (const game of games) {
      resolvedGames.push(
        await GameResolver.fromObject({
          creator: users.find((user) => user.id.toString() === game.creator.toString()),
          game,
          users: game.players.map((player) => users.find((user) => user.id === player.user.toString()) as User),
        })
      )
    }
    return resolvedGames
  }

  /**
   * Retrieves a Game with the given ID and converts it to the GraphQL object equivalent.
   *
   * @param id The ObjectId of the Game to convert.
   * @returns The resolved Game object with the given ID.
   * @throws Error if a Game with the given ID does not exist.
   */
  static async fromId(id: ObjectId | string): Promise<Game> {
    const game = await GameStore.getById({
      id,
    })

    Verifier.checkObjects({
      expectedKeys: [id],
      objects: [game],
      field: '_id',
      logger: GameResolver.logger,
      label: 'games',
    })

    return GameResolver.fromObject({
      game: game as GameDbObject,
    })
  }
}
