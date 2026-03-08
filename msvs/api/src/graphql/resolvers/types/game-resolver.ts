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
   * @param config.userId The ID of the User to resolve the Game for. Ensures that players cannot see which units spied into opponents hands.
   * @returns The resolved Game object matching its GraphQL schema definition.
   */
  static async fromObject({
    game,
    users,
    units,
    userId,
  }: {
    game: GameDbObject
    users?: User[]
    units?: Unit[]
    userId?: ObjectId
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
      userId,
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
   * @param config The configuration used to convert the Games.
   * @param config.games The Game database documents to convert.
   * @param config.spyUser The user to resolve GameUnits on spy Impacts for. Ensures that players cannot see which units spied into opponents hands.
   * @returns The resolved Game array matching the GraphQL schema definition.
   */
  static async fromArray({ games, spyUser }: { games: GameDbObject[]; spyUser: ObjectId }): Promise<Game[]> {
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
          userId: spyUser,
        })
      )
    }
    return resolvedGames
  }

  /**
   * Retrieves a Game with the given ID and converts it to the GraphQL object equivalent.
   *
   * @param config The configuration used to convert the Game.
   * @param config.id The ObjectId of the Game to convert.
   * @param config.spyUser The user to resolve GameUnits on spy Impacts for. Ensures that players cannot see which units spied into opponents hands.
   * @returns The resolved Game object with the given ID.
   * @throws {Error} if a Game with the given ID does not exist.
   */
  static async fromId({ id, spyUser }: { id: ObjectId | string; spyUser: ObjectId }): Promise<Game> {
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
      userId: spyUser,
    })
  }

  /**
   * Remove the Unit on Impacts for spied hand cards of Opponents.
   *
   * @param config The configuration used to mask the Units on Impacts for opponents Spies.
   * @param config.game The Game to mask spies for.
   * @param config.userId The ID of the user the game is being returned for, and whose Impacts will be excluded from masking.
   * @returns The Game with Opponents spied Impact Units removed.
   */
  static maskSpiedHandUnits({ game, userId }: { game: Game; userId: ObjectId | string }): Game {
    return {
      ...game,
      players: game.players.map((player) => {
        return {
          ...player,
          rounds: player.rounds.map((round) => {
            return {
              ...round,
              moves: round.moves.map((move) => {
                if (move.__typename === 'MoveUnit') {
                  return {
                    ...move,
                    impacts: move.impacts?.map((impact) => {
                      const hideImpactUnit = move.target?.id && impact.user.id !== userId.toString()
                      return {
                        ...impact,
                        unit: hideImpactUnit ? undefined : impact.unit,
                      }
                    }),
                  }
                }
                return move
              }),
            }
          }),
        }
      }),
    }
  }
}
