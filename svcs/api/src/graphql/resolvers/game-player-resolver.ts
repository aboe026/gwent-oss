import { ObjectId } from 'mongodb'

import { Faction, GamePlayer, GamePlayerUnitCounts, Leader, User } from '@gwent/graphql-schema/resolver-typings'
import FactionResolver from './faction-resolver'
import { GamePlayerDbObject } from '@gwent/graphql-schema/database-typings'
import { getUniqueItems } from '@gwent/utils'
import LeaderResolver from './leader-resolver'
import UserResolver from './user-resolver'

export default class GamePlayerResolver {
  static async fromObject({
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
        faction = await FactionResolver.fromId({
          id: player.deck.from.faction,
          neutrals: neutralFactionStats,
        })
      }
      if (!leader && player.deck.from?.leader) {
        leader = await LeaderResolver.fromId({
          id: player.deck.from.leader,
          neutralStats: neutralLeaderStats,
        })
      }
      counts = {
        discard: player.deck.discard.length,
        hand: player.deck.hand.length,
        undrawn: player.deck.undrawn.length,
      }
    }
    return {
      counts,
      faction: everyoneReady ? faction : undefined,
      leader: everyoneReady ? leader : undefined,
      ready: player.ready,
      rounds: player.rounds,
      user: user || (await UserResolver.fromId(player.user)),
    }
  }

  static async fromArray({
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
      resolvedUsers.push(...(await UserResolver.fromIds(userIdsToResolve)))
    }

    const factionIds = getUniqueItems<ObjectId>(players.map((player) => player.deck.from && player.deck.from.faction))
    const factions = await FactionResolver.fromIds({
      ids: factionIds,
      neutralStats: neutralFactionStats,
    })

    const leaderIds = getUniqueItems<ObjectId>(players.map((player) => player.deck.from && player.deck.from.leader))
    const leaders = await LeaderResolver.fromIds({
      ids: leaderIds,
      resolvedFactions: factions,
      neutralStats: neutralLeaderStats,
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
          user: resolvedUsers.find((user) => user.id.toString() === player.user.toString()),
          faction,
          leader,
          neutralFactionStats,
          neutralLeaderStats,
          everyoneReady,
        })
      )
    }

    return resolvedPlayers
  }
}
