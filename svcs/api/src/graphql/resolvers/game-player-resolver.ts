import { getLogger } from 'log4js'

import { GamePlayerDbObject } from '@gwent/graphql-schema/database-typings'
import { Faction, GamePlayer, GamePlayerUnitCounts, Leader, User } from '@gwent/graphql-schema/resolver-typings'
import UserResolver from './user-resolver'
import { getUniqueItems } from '@gwent/utils'
import { ObjectId } from 'mongodb'
import FactionResolver from './faction-resolver'
import LeaderResolver from './leader-resolver'

export default class GamePlayerResolver {
  private static logger = getLogger('game-player-resolver')

  static async resolveFromObject({
    player,
    user,
    faction,
    leader,
    neutralFactionStats,
    neutralLeaderStats,
    everyoneReady,
  }: {
    player: GamePlayerDbObject
    user?: User
    faction?: Faction | undefined
    leader?: Leader | undefined
    neutralFactionStats?: boolean
    neutralLeaderStats?: boolean
    everyoneReady: boolean
  }): Promise<GamePlayer> {
    let counts: GamePlayerUnitCounts | undefined = undefined
    if (everyoneReady) {
      if (!faction && player.deck.from?.faction) {
        faction = await FactionResolver.resolveFromId({
          id: player.deck.from.faction,
          neutrals: neutralFactionStats,
        })
        if (!faction) {
          const message = `Could not resolve faction "${player.deck.from.faction}" for game player "${player.user}".`
          GamePlayerResolver.logger.error(message)
          throw Error(message)
        }
      }
      if (!leader && player.deck.from?.leader) {
        leader = await LeaderResolver.resolveFromId({
          id: player.deck.from.leader,
          neutralStats: neutralLeaderStats,
        })
        if (!leader) {
          const message = `Could not resolve leader "${player.deck.from.leader}" for game player "${player.user}".`
          GamePlayerResolver.logger.error(message)
          throw Error(message)
        }
      }
      counts = {
        discard: player.deck.discard.length,
        hand: player.deck.hand.length,
        undrawn: player.deck.undrawn.length,
      }
    }
    const resolvedUser = user || (await UserResolver.resolveById(player.user))
    if (!resolvedUser) {
      const message = `Could not resolve user "${player.user}" as game player.`
      GamePlayerResolver.logger.error(message)
      throw Error(message)
    }
    return {
      counts,
      faction: everyoneReady ? faction : undefined,
      leader: everyoneReady ? leader : undefined,
      ready: player.ready,
      rounds: player.rounds,
      user: resolvedUser,
    }
  }

  static async resolveFromArray({
    players,
    users,
    everyoneReady,
    neutralFactionStats,
    neutralLeaderStats,
  }: {
    players: GamePlayerDbObject[]
    users?: User[]
    everyoneReady: boolean
    neutralFactionStats?: boolean
    neutralLeaderStats?: boolean
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
      resolvedUsers.concat(...(await UserResolver.resolveByIds(userIdsToResolve)))
    }

    const factionIds = getUniqueItems<ObjectId>(
      players
        .map((player) => player.deck.from && player.deck.from.faction)
        .filter((faction) => faction !== undefined && faction !== null)
    )
    const factions = await FactionResolver.resolveFromIds({
      ids: factionIds,
      neutralStats: neutralFactionStats,
    })

    const leaderIds = getUniqueItems<ObjectId>(
      players
        .map((player) => player.deck.from && player.deck.from.leader)
        .filter((leader) => leader !== undefined && leader !== null)
    )
    const leaders = await LeaderResolver.resolveFromIds({
      ids: leaderIds,
      resolvedFactions: factions,
      neutralStats: neutralLeaderStats,
    })

    const resolvedPlayers: GamePlayer[] = []
    for (const player of players) {
      let user: User | undefined = undefined
      if (users) {
        const resolvedUser = users.find((resolvedUser) => resolvedUser.id === player.user.toString())
        if (resolvedUser) {
          user = resolvedUser
        }
      }
      if (!user) {
        user = resolvedUsers.find((user) => user.id.toString() === player.user.toString()) as User
      }

      resolvedPlayers.push(
        await GamePlayerResolver.resolveFromObject({
          player,
          user,
          faction: player.deck.from && factions.find((faction) => faction.id === player.deck.from?.faction.toString()),
          leader: player.deck.from && leaders.find((leader) => leader.id === player.deck.from?.leader.toString()),
          neutralFactionStats,
          neutralLeaderStats,
          everyoneReady,
        })
      )
    }

    return resolvedPlayers
  }
}
