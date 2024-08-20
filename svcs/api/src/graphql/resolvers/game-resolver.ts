import { GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import { Game, User } from '@gwent/graphql-schema/resolver-typings'
import UserResolver from './user-resolver'
import GamePlayerResolver from './game-player-resolver'
import { getUniqueItems } from '@gwent/utils'
import { ObjectId } from 'mongodb'
import GameStore from '../../database/stores/game-store'

export default class GameResolver {
  static async resolveFromObject({
    creator,
    game,
    users,
    neutralFactionStats,
    neutralLeaderStats,
  }: {
    game: GameDbObject
    creator?: User
    users?: User[]
    neutralFactionStats?: boolean
    neutralLeaderStats?: boolean
  }): Promise<Game> {
    const resolvedCreator = creator || (await UserResolver.resolveById(game.creator))
    return {
      created: game.created,
      creator: resolvedCreator,
      id: game._id.toString(),
      players: await GamePlayerResolver.resolveFromArray({
        players: game.players,
        users: users || [resolvedCreator],
        everyoneReady: GameResolver.isEveryoneReady(game),
        neutralFactionStats,
        neutralLeaderStats,
      }),
      round: game.round,
      status: GameResolver.getStatus(game),
      updated: game.updated,
      victors: game.victors,
    }
  }

  static async resolveFromArray(games: GameDbObject[]): Promise<Game[]> {
    const userIds = getUniqueItems<string>(games.map((game) => game.creator.toString()))

    for (const game of games) {
      for (const player of game.players) {
        const userId = player.user.toString()
        if (!userIds.includes(userId)) {
          userIds.push(userId)
        }
      }
    }

    const users = await UserResolver.resolveByIds(userIds)

    const resolvedGames: Game[] = []
    for (const game of games) {
      const creator = users.find((user) => user.id.toString() === game.creator.toString()) as User
      const playerUsers: User[] = []
      for (const player of game.players) {
        playerUsers.push(users.find((user) => user.id === player.user.toString()) as User)
      }

      resolvedGames.push(
        await GameResolver.resolveFromObject({
          creator,
          game,
          users: playerUsers,
        })
      )
    }
    return resolvedGames
  }

  static async resolveById(id: ObjectId | string): Promise<Game | undefined> {
    const game = await GameStore.getById({
      id,
    })
    if (game) {
      return GameResolver.resolveFromObject({
        game,
      })
    }
  }

  static isEveryoneReady(game: GameDbObject): boolean {
    return game.players.filter((player) => player.ready).length === game.players.length
  }

  static getStatus(game: GameDbObject): GameStatus {
    if (game.victors.length > 0) {
      return GameStatus.Done
    }
    if (!GameResolver.isEveryoneReady(game)) {
      return GameStatus.Decking
    }
    return GameStatus.Playing
  }
}
