import { getLogger } from 'log4js'

import {
  DeckUnit,
  Leader,
  Move,
  MoveReasonType,
  GameUnitOrigin,
  User,
  Unit,
} from '@gwent/graphql-schema/resolver-typings'
import DeckUnitResolver from './deck-unit-resolver'
import GameUnitResolver from './game-unit-resolver'
import ImpactResolver from './impact-resolver'
import LeaderResolver from './leader-resolver'
import {
  MoveDbObject,
  MoveLeaderDbObject,
  MovePassDbObject,
  MoveUnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import { MoveType } from '@gwent/graphql-schema'
import ResolverUtil from '../resolver-util'

/**
 * A class to convert Move database objects to their GraphQL equivalent.
 */
export default class MoveResolver {
  private static logger = getLogger('MoveResolver')

  /**
   * Converts a single Move database object to a single Move GraphQL object.
   *
   * @param config The configuration used to resolve the Move.
   * @param config.move The database object to resolve to its GraphQL type.
   * @param config.leader An optional pre-resolved Leader. If not specified, will retreive the Leader from the database to resolve.
   * @param config.units An optional pre-resolved Units. If not specified, will retreive the Units from the database to resolve.
   * @param config.users An optional pre-resolved Users. If not specified, will retreive the Users from the database to resolve.
   * @returns The resolved Move object matching its GraphQL schema definition.
   * @throws Error if the move type is invalid.
   */
  static async fromObject({
    move,
    leader,
    units,
    users,
  }: {
    move: MoveDbObject
    leader?: Leader
    units?: Unit[]
    users?: User[]
  }): Promise<Move> {
    if (move.type === MoveType.Leader) {
      const leaderMove = move as MoveLeaderDbObject
      return {
        created: leaderMove.created,
        leader:
          leader ||
          (await LeaderResolver.fromId({
            id: leaderMove.leader,
          })),
        __typename: 'MoveLeader',
      }
    } else if (move.type === MoveType.Pass) {
      const passMove = move as MovePassDbObject
      return {
        created: passMove.created,
        __typename: 'MovePass',
      }
    } else if (move.type === MoveType.Unit) {
      const unitMove = move as MoveUnitDbObject
      const { units: resolvedUnits, users: resolvedUsers } = await ResolverUtil.resolveUsersAndUnits({
        moves: [unitMove],
        presolvedUnits: units,
        presolvedUsers: users,
      })
      const unitForMove = resolvedUnits.find((unit) => unit.id === unitMove.unit.unit.toString())
      if (!unitForMove) {
        throw Error(`Could not find move unit "${unitMove.unit.unit}"`)
      }
      let resolvedReasonDeckUnit: DeckUnit | undefined = undefined
      if (unitMove.reason.unit) {
        const reasonUnit = resolvedUnits.find((unit) => unit.id === unitMove.reason.unit?.unit.toString())
        if (!reasonUnit) {
          throw Error(`Could not find reason unit "${unitMove.reason.unit?.unit}"`)
        }
        resolvedReasonDeckUnit = await DeckUnitResolver.fromObject({
          deckUnit: unitMove.reason.unit,
          unit: reasonUnit,
        })
      }
      let resolvedSourceUser: User | undefined = undefined
      if (unitMove.source.user) {
        resolvedSourceUser = resolvedUsers.find((user) => user.id === unitMove.source.user?.toString())
        if (!resolvedSourceUser) {
          throw Error(`Could not find source user "${unitMove.source.user}"`)
        }
      }
      return {
        created: unitMove.created,
        unit: await GameUnitResolver.fromObject({
          gameUnit: unitMove.unit,
          unit: unitForMove,
        }),
        impacts: await ImpactResolver.fromArray({
          impacts: unitMove.impacts,
          units: resolvedUnits,
          users: resolvedUsers,
        }),
        reason: {
          type: unitMove.reason.type as MoveReasonType,
          unit: resolvedReasonDeckUnit,
        },
        source: {
          origin: unitMove.source.origin as GameUnitOrigin,
          user: resolvedSourceUser,
        },
        __typename: 'MoveUnit',
      }
    }
    throw Error(`Invalid Move type "${move.type}".`)
  }

  /**
   * Converts an array of Move database objects to an array of Move GraphQL objects.
   *
   * @param config The configuration used to convert the array.
   * @param config.moves The array of Move database objects to convert.
   * @param config.units An optional pre-resolved Units. If not specified, will retreive the Units from the database to resolve.
   * @param config.users An optional pre-resolved Users. If not specified, will retreive the Users from the database to resolve.
   * @returns The resolved Move array matching the GraphQL schema definition.
   */
  static async fromArray({
    moves,
    units,
    users,
  }: {
    moves: MoveDbObject[]
    units?: Unit[]
    users?: User[]
  }): Promise<Move[]> {
    if (moves.length === 0) {
      return []
    }

    const { units: resolvedUnits, users: resolvedUsers } = await ResolverUtil.resolveUsersAndUnits({
      moves,
      presolvedUnits: units,
      presolvedUsers: users,
    })

    const leaderIds: string[] = []
    for (const move of moves) {
      if (move.type === MoveType.Leader) {
        const leaderMove = move as MoveLeaderDbObject
        const leaderId = leaderMove.leader.toString()
        if (!leaderIds.includes(leaderId)) {
          leaderIds.push(leaderId)
        }
      }
    }
    const resolvedLeaders = await LeaderResolver.fromIds({
      ids: leaderIds,
    })

    const resolvedMoves: Move[] = []
    for (const move of moves) {
      let leader: Leader | undefined = undefined
      if (move.type === MoveType.Leader) {
        const leaderMove = move as MoveLeaderDbObject
        leader = resolvedLeaders.find((leader) => leader.id === leaderMove.leader.toString())
        if (!leader) {
          const message = `Could not find move leader "${leaderMove.leader}"`
          MoveResolver.logger.error(`${message}, move: "${JSON.stringify(move)}"`)
          throw Error(`${message}.`)
        }
      }
      resolvedMoves.push(
        await MoveResolver.fromObject({
          move,
          leader,
          units: resolvedUnits,
          users: resolvedUsers,
        })
      )
    }
    return resolvedMoves
  }
}
