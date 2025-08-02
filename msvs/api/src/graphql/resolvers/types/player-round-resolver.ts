import GameUnitResolver from './game-unit-resolver'
import MoveResolver from './move-resolver'
import { PlayerRound, RoundResult, Unit, User } from '@gwent/graphql-schema/resolver-typings'
import { PlayerRoundDbObject } from '@gwent/graphql-schema/database-typings'
import ResolverUtil from '../resolver-util'

/**
 * A class to convert PlayerRound database objects to their GraphQL equivalent.
 */
export default class PlayerRoundResolver {
  /**
   * Converts a single PlayerRound database object to a single PlayerRound GraphQL object.
   *
   * @param config The configuration for resolving the PlayerRound.
   * @param config.round The database object to resolve to its GraphQL type.
   * @param config.units An optional pre-resolved Units. If not specified, will retreive the Units from the databae to resolve.
   * @param config.leader An optional pre-resolved Leader. If not specified, will retreive the Leader from the databae to resolve.
   * @returns The resolved PlayerRound object matching its GraphQL schema definition.
   */
  static async fromObject({
    round,
    units,
    users,
  }: {
    round: PlayerRoundDbObject
    units?: Unit[]
    users?: User[]
  }): Promise<PlayerRound> {
    const { units: resolvedUnits, users: resolvedUsers } = await ResolverUtil.resolveMoveUsersAndUnits({
      moves: round.moves,
      gameUnits: [...round.close.units, ...round.ranged.units, ...round.siege.units],
      presolvedUnits: units,
      presolvedUsers: users,
    })

    return {
      close: {
        score: round.close.score,
        units: await GameUnitResolver.fromArray({
          gameUnits: round.close.units,
          units: resolvedUnits,
        }),
      },
      ranged: {
        score: round.ranged.score,
        units: await GameUnitResolver.fromArray({
          gameUnits: round.ranged.units,
          units: resolvedUnits,
        }),
      },
      siege: {
        score: round.siege.score,
        units: await GameUnitResolver.fromArray({
          gameUnits: round.siege.units,
          units: resolvedUnits,
        }),
      },
      score: round.score,
      result: round.result ? (round.result as RoundResult) : undefined,
      moves: await MoveResolver.fromArray({
        moves: round.moves,
        units: resolvedUnits,
        users: resolvedUsers,
      }),
      passed: round.passed,
    }
  }

  /**
   * Converts an array of PlayerRound database objects to an array of PlayerRound GraphQL objects.
   *
   * @param config The configuration used to resolve the PlayerRounds.
   * @param config.rounds The database objects to resolve to their GraphQL types.
   * @param config.leader An optional pre-resolved Leader. If not specified, will retreive the Leader from the databae to resolve.
   * @returns The resolved PlayerRound array matching the GraphQL schema definition.
   */
  static async fromArray({ rounds, users }: { rounds: PlayerRoundDbObject[]; users?: User[] }): Promise<PlayerRound[]> {
    const { units, users: resolvedUsers } = await ResolverUtil.resolveMoveUsersAndUnits({
      moves: rounds.map((round) => round.moves).flat(),
      gameUnits: rounds.map((round) => [...round.close.units, ...round.ranged.units, ...round.siege.units]).flat(),
      presolvedUsers: users,
    })

    const resolvedPlayerRounds: PlayerRound[] = []
    for (const round of rounds) {
      resolvedPlayerRounds.push(
        await PlayerRoundResolver.fromObject({
          round,
          units,
          users: resolvedUsers,
        })
      )
    }
    return resolvedPlayerRounds
  }
}
