import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Faction, GamePlayer, GamePlayerUnitCounts, Leader, User } from '@gwent/graphql-schema/resolver-typings'
import FactionResolver from './faction-resolver'
import { GamePlayerDbObject, GameStatus, MoveUnitDbObject } from '@gwent/graphql-schema/database-typings'
import { getUniqueItems } from '@gwent/utils'
import LeaderResolver from './leader-resolver'
import { MoveType } from '@gwent/graphql-schema'
import PlayerRoundResolver from './player-round-resolver'
import UserResolver from './user-resolver'

/**
 * A class to convert GamePlayer database objects to their GraphQL equivalent.
 */
export default class GamePlayerResolver {
  private static logger = getLogger('GamePlayerResolver')
  /**
   * Converts a single GamePlayer database object to a single GamePlayer GraphQL object.
   *
   * @param config The configuration used to convert the GamePlayer.
   * @param config.faction The resolved Faction for the GamePlayer. If not provided, will be retrieved.
   * @param config.leader The resolved Leader for the GamePlayer. If not provided, will be retrieved.
   * @param config.player The GamePlayer to convert.
   * @param config.user The resolved User for the GamePlayer. If not provided, will be retrieved.
   * @param config.gameStatus The current status of the Game.
   * @returns The resolved GamePlayer object matching its GraphQL schema definition.
   */
  static async fromObject({
    faction,
    leader,
    player,
    users,
    gameStatus,
  }: {
    faction?: Faction | undefined
    leader?: Leader | undefined
    player: GamePlayerDbObject
    users?: User[]
    gameStatus: GameStatus
  }): Promise<GamePlayer> {
    let counts: GamePlayerUnitCounts | undefined = undefined
    if (gameStatus !== GameStatus.Decking) {
      if (!faction && player.deck.from?.faction) {
        faction = await FactionResolver.fromId({
          id: player.deck.from.faction,
        })
      }
      if (!leader && player.deck.from?.leader) {
        leader = await LeaderResolver.fromId({
          id: player.deck.from.leader,
        })
      }
      counts = {
        discard: player.deck.discard.length,
        hand: player.deck.hand.length,
        undrawn: player.deck.undrawn.length,
      }
    }

    const resolvedUsers: User[] = []
    if (users) {
      resolvedUsers.push(...users)
    } else {
      const userIdsToResolve = [player.user.toString()]
      for (const round of player.rounds) {
        for (const move of round.moves) {
          if (move.type === MoveType.Unit) {
            const moveUnit = move as MoveUnitDbObject
            if (moveUnit.source.user) {
              const userId = moveUnit.source.user.toString()
              if (!userIdsToResolve.includes(userId)) {
                userIdsToResolve.push(userId)
              }
            }
          }
        }
      }
      resolvedUsers.push(...(await UserResolver.fromIds(userIdsToResolve)))
    }

    const playerUser = resolvedUsers.find((user) => user.id === player.user.toString())
    if (!playerUser) {
      const message = `Could not find user "${player.user}" in pre-resolved users`
      GamePlayerResolver.logger.error(`${message}, users: "${JSON.stringify(users)}"`)
      throw Error(`${message}.`)
    }

    return {
      counts,
      faction: gameStatus === GameStatus.Decking ? undefined : faction,
      leader: gameStatus === GameStatus.Decking ? undefined : leader,
      order: player.order,
      ready: player.ready,
      rounds: await PlayerRoundResolver.fromArray({
        rounds: player.rounds,
        users,
      }),
      user: playerUser,
    }
  }

  /**
   * Converts an array of GamePlayer database objects to an array of GamePlayer GraphQL objects.
   *
   * @param config The configuration used to convert the array.
   * @param config.players The array of GamePlayer database objects to convert.
   * @param config.users The resolved Users for the GamePlayers. If not provided, will be retrieved.
   * @param config.gameStatus The current status of the Game.
   * @returns The resolved Deck array matching the GraphQL schema definition.
   */
  static async fromArray({
    players,
    users,
    gameStatus,
  }: {
    players: GamePlayerDbObject[]
    users?: User[]
    gameStatus: GameStatus
  }): Promise<GamePlayer[]> {
    let preResolvedUserIds: string[] = []
    if (users) {
      preResolvedUserIds = getUniqueItems<string>(users.map((user) => user.id))
    }
    const userIdsToResolve = getUniqueItems<ObjectId>(
      players.filter((player) => !preResolvedUserIds.includes(player.user.toString())).map((player) => player.user)
    )
    const resolvedUsers: User[] = users || []
    if (userIdsToResolve.length > 0) {
      resolvedUsers.push(...(await UserResolver.fromIds(userIdsToResolve)))
    }

    const factionIds = getUniqueItems<ObjectId>(players.map((player) => player.deck.from && player.deck.from.faction))
    const factions = await FactionResolver.fromIds({
      ids: factionIds,
    })

    const leaderIds = getUniqueItems<ObjectId>(players.map((player) => player.deck.from && player.deck.from.leader))
    const leaders = await LeaderResolver.fromIds({
      ids: leaderIds,
      resolvedFactions: factions,
    })

    const resolvedPlayers: GamePlayer[] = []
    for (const player of players) {
      let faction: Faction | undefined
      let leader: Leader | undefined
      if (player.deck.from) {
        faction = factions.find((faction) => faction.id === player.deck.from?.faction.toString())
        leader = leaders.find((leader) => leader.id === player.deck.from?.leader.toString())
      }

      resolvedPlayers.push(
        await GamePlayerResolver.fromObject({
          player,
          users: resolvedUsers,
          faction,
          leader,
          gameStatus,
        })
      )
    }

    return resolvedPlayers
  }
}
