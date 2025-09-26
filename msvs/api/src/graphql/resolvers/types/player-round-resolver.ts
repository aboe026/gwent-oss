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
   * @param config.users An optional pre-resolved Users. If not specified, will retreive the Users from the databae to resolve.
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
    const { units: resolvedUnits, users: resolvedUsers } = await ResolverUtil.resolveUsersAndUnits({
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
        // TODO: make combat-row-resolver to avoid duplicate code
        modifier: round.close.modifier
          ? await GameUnitResolver.fromObject({
              gameUnit: round.close.modifier,
            })
          : undefined,
      },
      ranged: {
        score: round.ranged.score,
        units: await GameUnitResolver.fromArray({
          gameUnits: round.ranged.units,
          units: resolvedUnits,
        }),
        modifier: round.ranged.modifier
          ? await GameUnitResolver.fromObject({
              gameUnit: round.ranged.modifier,
            })
          : undefined,
      },
      siege: {
        score: round.siege.score,
        units: await GameUnitResolver.fromArray({
          gameUnits: round.siege.units,
          units: resolvedUnits,
        }),
        modifier: round.siege.modifier
          ? await GameUnitResolver.fromObject({
              gameUnit: round.siege.modifier,
            })
          : undefined,
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
   * @param config.users An optional list of pre-resolved Users. If not specified, will retreive the Users from the databae to resolve.
   * @param config.units An optional list of pre-resolved Units. If not specified, will retreive the Units from the databae to resolve.
   * @returns The resolved PlayerRound array matching the GraphQL schema definition.
   */
  static async fromArray({
    rounds,
    users,
    units,
  }: {
    rounds: PlayerRoundDbObject[]
    users?: User[]
    units?: Unit[]
  }): Promise<PlayerRound[]> {
    if (rounds.length === 0) {
      return []
    }

    const { units: resolvedUnits, users: resolvedUsers } = await ResolverUtil.resolveUsersAndUnits({
      moves: rounds.map((round) => round.moves).flat(),
      gameUnits: rounds.map((round) => [...round.close.units, ...round.ranged.units, ...round.siege.units]).flat(),
      presolvedUsers: users,
      presolvedUnits: units,
    })

    const resolvedPlayerRounds: PlayerRound[] = []
    for (const round of rounds) {
      resolvedPlayerRounds.push(
        await PlayerRoundResolver.fromObject({
          round,
          units: resolvedUnits,
          users: resolvedUsers,
        })
      )
    }
    return resolvedPlayerRounds
  }
}
