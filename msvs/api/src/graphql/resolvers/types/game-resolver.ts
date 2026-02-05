import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Game, GamePlayer, Unit, User } from '@gwent/graphql-schema/resolver-typings'
import { GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import GamePlayerResolver from './game-player-resolver'
import GameStore from '../../../database/stores/game-store'
import getGameUnits from '../mutations/play-unit/get-game-units'
import ResolverUtil from '../resolver-util'
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
   * @param config.game The Game to convert.
   * @param config.units An optional pre-resolved Units. If not specified, will retreive the Units from the database to resolve.
   * @param config.users An optional pre-resolved Users. If not specified, will retreive the Users from the database to resolve.
   * @returns The resolved Game object matching its GraphQL schema definition.
   */
  static async fromObject({
    game,
    users,
    units,
  }: {
    game: GameDbObject
    users?: User[]
    units?: Unit[]
  }): Promise<Game> {
    const status = game.status as GameStatus
    const rounds = game.players.map((player) => player.rounds).flat()
    const { units: resolvedUnits, users: resolvedUsers } = await ResolverUtil.resolveUsersAndUnits({
      moves: rounds.map((round) => round.moves).flat(),
      gameUnits: getGameUnits({
        rounds,
      }),
      userIds: game.players.map((player) => player.user),
      presolvedUnits: units,
      presolvedUsers: users,
    })
    const resolvedPlayers = await GamePlayerResolver.fromArray({
      players: game.players,
      gameStatus: status,
      users: resolvedUsers,
      units: resolvedUnits,
    })

    const creator = resolvedUsers.find((user) => user.id === game.creator.toString())
    if (!creator) {
      throw Error(`Could not find creator "${game.creator}" in resolved users`)
    }
    let turn: GamePlayer | undefined = undefined
    if (game.turn) {
      turn = resolvedPlayers.find((player) => player.user.id === game.turn?.toString())
      if (!turn) {
        throw Error(`Could not find turn "${game.turn}" in resolved players`)
      }
    }
    const victors: User[] = []
    for (const victorId of game.victors) {
      const victor = resolvedUsers.find((user) => user.id === victorId.toString())
      if (victor) {
        victors.push(victor)
      } else {
        throw Error(`Could not find victor "${victorId}" in resolved users`)
      }
    }

    return {
      config: game.config,
      created: game.created,
      creator,
      id: game._id.toString(),
      players: resolvedPlayers,
      round: game.round,
      status,
      turn,
      updated: game.updated,
      victors,
    }
  }

  /**
   * Converts an array of Game database objects to an array of Game GraphQL objects.
   *
   * @param games The Game database documents to convert.
   * @returns The resolved Game array matching the GraphQL schema definition.
   */
  static async fromArray(games: GameDbObject[]): Promise<Game[]> {
    if (games.length === 0) {
      return []
    }

    const rounds = games
      .map((game) => game.players)
      .flat()
      .map((player) => player.rounds)
      .flat()
    const { units, users } = await ResolverUtil.resolveUsersAndUnits({
      moves: rounds.map((round) => round.moves).flat(),
      gameUnits: getGameUnits({
        rounds,
      }),
      userIds: games
        .map((game) => game.players)
        .flat()
        .map((player) => player.user),
    })

    const resolvedGames: Game[] = []
    for (const game of games) {
      resolvedGames.push(
        await GameResolver.fromObject({
          game,
          users,
          units,
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
   * @throws {Error} if a Game with the given ID does not exist.
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
