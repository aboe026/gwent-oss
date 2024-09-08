import { getLogger } from 'log4js'

import { GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import { Game, User } from '@gwent/graphql-schema/resolver-typings'
import UserResolver from './user-resolver'
import GamePlayerResolver from './game-player-resolver'
import { getUniqueItems } from '@gwent/utils'
import { ObjectId } from 'mongodb'
import GameStore from '../../database/stores/game-store'
import verifyObjects from '../../util/verify-objects'

export default class GameResolver {
  private static logger = getLogger('game-resolver')

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
    const resolvedUsers: User[] = []
    if (creator) {
      resolvedUsers.push(creator)
    }
    if (users) {
      resolvedUsers.push(...users)
    }
    const preResolvedUserIds: string[] = resolvedUsers.map((user) => user.id)
    const userIdsToResolve: string[] = []
    if (!preResolvedUserIds.includes(game.creator.toString())) {
      userIdsToResolve.push(game.creator.toString())
    }
    for (const player of game.players) {
      if (!userIdsToResolve.includes(player.user.toString()) && !preResolvedUserIds.includes(player.user.toString())) {
        userIdsToResolve.push(player.user.toString())
      }
    }
    for (const victor of game.victors) {
      if (!userIdsToResolve.includes(victor.toString()) && !preResolvedUserIds.includes(victor.toString())) {
        userIdsToResolve.push(victor.toString())
      }
    }
    resolvedUsers.push(...(await UserResolver.resolveByIds(userIdsToResolve)))

    return {
      created: game.created,
      creator: creator || (resolvedUsers?.find((user) => user.id === game.creator.toString()) as User),
      id: game._id.toString(),
      players: await GamePlayerResolver.resolveFromArray({
        players: game.players,
        users: resolvedUsers,
        everyoneReady: GameResolver.isEveryoneReady(game),
        neutralFactionStats,
        neutralLeaderStats,
      }),
      round: game.round,
      status: GameResolver.getStatus(game),
      updated: game.updated,
      victors: game.victors.map((victor) => resolvedUsers.find((user) => user.id === victor.toString()) as User),
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
      resolvedGames.push(
        await GameResolver.resolveFromObject({
          creator: users.find((user) => user.id.toString() === game.creator.toString()),
          game,
          users: game.players.map((player) => users.find((user) => user.id === player.user.toString()) as User),
        })
      )
    }
    return resolvedGames
  }

  // todo: reconcile resolveFromId and resolveById (maybe just resolveId)
  static async resolveById(id: ObjectId | string): Promise<Game | undefined> {
    const game = await GameStore.getById({
      id,
    })

    verifyObjects({
      expectedKeys: [id],
      objects: [game],
      key: '_id',
      logger: GameResolver.logger,
      resourceLabelPlural: 'games',
    })

    return GameResolver.resolveFromObject({
      game: game as GameDbObject,
    })
  }

  static isEveryoneReady(game: GameDbObject): boolean {
    return game.players.length > 0 && game.players.filter((player) => player.ready).length === game.players.length
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
