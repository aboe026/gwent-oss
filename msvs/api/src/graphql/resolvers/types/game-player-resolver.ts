import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import {
  Faction,
  GamePlayer,
  GamePlayerUnitCounts,
  Leader,
  Unit,
  User,
} from '@gwent-oss/graphql-schema/resolver-typings'
import FactionResolver from './faction-resolver'
import { GamePlayerDbObject, GameStatus } from '@gwent-oss/graphql-schema/database-typings'
import GetFieldUnits from '../util/get-field-units'
import { getUniqueItems } from '@gwent-oss/utils'
import getWeatherUnits from '../mutations/play-unit/get-weather-units'
import LeaderResolver from './leader-resolver'
import PlayerRoundResolver from './player-round-resolver'
import ResolverUtil from '../resolver-util'

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
   * @param config.units An optional pre-resolved Units. If not specified, will retreive the Units from the database to resolve.
   * @param config.users An optional pre-resolved Users. If not specified, will retreive the Users from the database to resolve.
   * @param config.gameStatus The current status of the Game.
   * @returns The resolved GamePlayer object matching its GraphQL schema definition.
   */
  static async fromObject({
    faction,
    leader,
    player,
    users,
    units,
    gameStatus,
  }: {
    faction?: Faction | undefined
    leader?: Leader | undefined
    player: GamePlayerDbObject
    users?: User[]
    units?: Unit[]
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

    const rounds = player.rounds.flat()
    const { users: resolvedUsers, units: resolvedUnits } = await ResolverUtil.resolveUsersAndUnits({
      moves: rounds.map((round) => round.moves).flat(),
      fieldUnits: GetFieldUnits.fromRounds({
        rounds,
      }),
      weatherUnits: getWeatherUnits({
        rounds,
      }),
      presolvedUsers: users,
      presolvedUnits: units,
    })

    const playerUser = resolvedUsers.find((user) => user.id === player.user.toString())
    if (!playerUser) {
      const message = `Could not find user "${player.user}"`
      GamePlayerResolver.logger.error(`${message}, resolvedUsers: "${JSON.stringify(resolvedUsers)}"`)
      throw Error(`${message}.`)
    }

    return {
      counts,
      faction: gameStatus === GameStatus.Decking ? undefined : faction,
      leader: gameStatus === GameStatus.Decking ? undefined : leader,
      order: player.order,
      ready: player.ready,
      reviving: player.reviving,
      rounds: await PlayerRoundResolver.fromArray({
        rounds: player.rounds,
        users: resolvedUsers,
        units: resolvedUnits,
      }),
      user: playerUser,
    }
  }

  /**
   * Converts an array of GamePlayer database objects to an array of GamePlayer GraphQL objects.
   *
   * @param config The configuration used to convert the array.
   * @param config.players The array of GamePlayer database objects to convert.
   * @param config.units An optional pre-resolved Units. If not specified, will retreive the Units from the database to resolve.
   * @param config.users An optional pre-resolved Users. If not specified, will retreive the Users from the database to resolve.
   * @param config.gameStatus The current status of the Game.
   * @returns The resolved Deck array matching the GraphQL schema definition.
   */
  static async fromArray({
    players,
    users,
    units,
    gameStatus,
  }: {
    players: GamePlayerDbObject[]
    users?: User[]
    units?: Unit[]
    gameStatus: GameStatus
  }): Promise<GamePlayer[]> {
    if (players.length === 0) {
      return []
    }

    const rounds = players
      .flat()
      .map((player) => player.rounds)
      .flat()
    const { units: resolvedUnits, users: resolvedUsers } = await ResolverUtil.resolveUsersAndUnits({
      moves: rounds.map((round) => round.moves).flat(),
      fieldUnits: GetFieldUnits.fromRounds({
        rounds,
      }),
      weatherUnits: getWeatherUnits({
        rounds,
      }),
      presolvedUsers: users,
      presolvedUnits: units,
    })

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
        if (!faction) {
          throw Error(`Could not find faction "${player.deck.from?.faction}" in resolved factions`)
        }
        leader = leaders.find((leader) => leader.id === player.deck.from?.leader.toString())
        if (!leader) {
          throw Error(`Could not find leader "${player.deck.from?.leader}" in resolved leaders`)
        }
      }

      resolvedPlayers.push(
        await GamePlayerResolver.fromObject({
          player,
          users: resolvedUsers,
          units: resolvedUnits,
          faction,
          leader,
          gameStatus,
        })
      )
    }

    return resolvedPlayers
  }
}
