import { GameUnit, Leader, Move, PlayerRound, RoundResult, Unit } from '@gwent/graphql-schema/resolver-typings'
import {
  GameUnitDbObject,
  MoveLeaderDbObject,
  MoveUnitDbObject,
  PlayerRoundDbObject,
} from '@gwent/graphql-schema/database-typings'
import GameUnitResolver from './game-unit-resolver'
import MoveResolver from './move-resolver'
import { MoveType } from '@gwent/graphql-schema'
import UnitResolver from './unit-resolver'

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
    leader,
  }: {
    round: PlayerRoundDbObject
    units?: Unit[]
    leader?: Leader
  }): Promise<PlayerRound> {
    let resolvedUnits: Unit[] = []
    if (units) {
      resolvedUnits = units
    } else {
      const gameUnits = [...round.close.units, ...round.ranged.units, ...round.siege.units]
      resolvedUnits = await UnitResolver.fromIds({
        ids: gameUnits.map((gameUnit) => gameUnit.unit),
      })
    }
    const moves: Move[] = []
    for (const move of round.moves) {
      let gameUnit: GameUnit | undefined = undefined
      if (move.type === MoveType.Unit) {
        const moveUnit = (move as MoveUnitDbObject).unit
        const matchingUnit = resolvedUnits.find((unit) => unit.id === moveUnit.unit.toString())
        gameUnit = await GameUnitResolver.fromObject({
          gameUnit: moveUnit,
          unit: matchingUnit,
        })
      }
      let moveLeader: Leader | undefined = undefined
      if (move.type === MoveType.Leader) {
        if (leader && leader.id === (move as MoveLeaderDbObject).leader.toString()) {
          moveLeader = leader
        }
      }
      moves.push(
        await MoveResolver.fromObject({
          move,
          gameUnit,
          leader: moveLeader,
        })
      )
    }
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
      moves,
      passed: round.passed,
    }
  }

  /**
   * Converts an array of PlayerRound database objects to an array of PlayerRound GraphQL objects.
   *
   * @param config The configuration used to resolve the PlayerRounds.
   * @param config.rounds The database objects to resolve to their GraphQL types.
   * @param leaders An optional pre-resolved Leader. If not specified, will retreive the Leader from the databae to resolve.
   * @returns The resolved PlayerRound array matching the GraphQL schema definition.
   */
  static async fromArray({
    rounds,
    leader,
  }: {
    rounds: PlayerRoundDbObject[]
    leader?: Leader
  }): Promise<PlayerRound[]> {
    const gameUnits: GameUnitDbObject[] = []
    for (const round of rounds) {
      gameUnits.push(...round.close.units, ...round.ranged.units, ...round.siege.units)
    }
    const units = await UnitResolver.fromIds({
      ids: gameUnits.map((gameUnit) => gameUnit.unit),
    })

    const resolvedPlayerRounds: PlayerRound[] = []
    for (const round of rounds) {
      resolvedPlayerRounds.push(
        await PlayerRoundResolver.fromObject({
          round,
          units,
          leader,
        })
      )
    }
    return resolvedPlayerRounds
  }
}
