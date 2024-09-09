import { getLogger } from 'log4js'

import { GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import { Game, User } from '@gwent/graphql-schema/resolver-typings'
import UserResolver from './user-resolver'
import GamePlayerResolver from './game-player-resolver'
import { getUniqueItems } from '@gwent/utils'
import { ObjectId } from 'mongodb'
import GameStore from '../../database/stores/game-store'
import Verifier from '../../util/verifier'

export default class GameResolver {
  private static logger = getLogger('game-resolver')

  static async fromObject({
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
    for (const player of game.players) {
      if (!userIdsToResolve.includes(player.user.toString()) && !preResolvedUserIds.includes(player.user.toString())) {
        userIdsToResolve.push(player.user.toString())
      }
    }
    resolvedUsers.push(...(await UserResolver.fromIds(userIdsToResolve)))

    return {
      created: game.created,
      creator: creator || (resolvedUsers?.find((user) => user.id === game.creator.toString()) as User),
      id: game._id.toString(),
      players: await GamePlayerResolver.fromArray({
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

  // todo: reconcile fromId and fromId (maybe just fromId?)
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
