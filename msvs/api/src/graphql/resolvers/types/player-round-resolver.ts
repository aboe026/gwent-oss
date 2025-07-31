import GameUnitResolver from './game-unit-resolver'
import MoveResolver from './move-resolver'
import { MoveType } from '@gwent/graphql-schema'
import { MoveUnitDbObject, PlayerRoundDbObject } from '@gwent/graphql-schema/database-typings'
import { PlayerRound, RoundResult, Unit } from '@gwent/graphql-schema/resolver-typings'
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
  static async fromObject({ round, units }: { round: PlayerRoundDbObject; units?: Unit[] }): Promise<PlayerRound> {
    const resolvedUnitIds = units ? units.map((unit) => unit.id) : []
    const unitIdsToResolve: string[] = []

    const gameUnits = [...round.close.units, ...round.ranged.units, ...round.siege.units]
    for (const gameUnit of gameUnits) {
      const unitId = gameUnit.unit.toString()
      if (!resolvedUnitIds.includes(unitId)) {
        unitIdsToResolve.push(unitId)
      }
    }

    for (const move of round.moves) {
      if (move.type === MoveType.Unit) {
        const moveUnit = move as MoveUnitDbObject
        const gameUnitId = moveUnit.unit.unit.toString()
        if (!resolvedUnitIds.includes(gameUnitId)) {
          unitIdsToResolve.push(gameUnitId)
        }
        if (moveUnit.reason.unit) {
          const reasonUnitId = moveUnit.reason.unit.unit.toString()
          if (!resolvedUnitIds.includes(reasonUnitId)) {
            unitIdsToResolve.push(reasonUnitId)
          }
        }
      }
    }

    const resolvedUnits: Unit[] = units ? units : []
    resolvedUnits.push(
      ...(await UnitResolver.fromIds({
        ids: unitIdsToResolve,
      }))
    )

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
        // TODO: pre-fetch users?
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
  static async fromArray({ rounds }: { rounds: PlayerRoundDbObject[] }): Promise<PlayerRound[]> {
    const unitIdsToResolve: string[] = []
    for (const round of rounds) {
      const gameUnits = [...round.close.units, ...round.ranged.units, ...round.siege.units]
      for (const gameUnit of gameUnits) {
        const unitId = gameUnit.unit.toString()
        if (!unitIdsToResolve.includes(unitId)) {
          unitIdsToResolve.push(unitId)
        }
      }

      for (const move of round.moves) {
        if (move.type === MoveType.Unit) {
          const moveUnit = move as MoveUnitDbObject
          const gameUnitId = moveUnit.unit.unit.toString()
          if (!unitIdsToResolve.includes(gameUnitId)) {
            unitIdsToResolve.push(gameUnitId)
          }
          if (moveUnit.reason.unit) {
            const reasonUnitId = moveUnit.reason.unit.unit.toString()
            if (!unitIdsToResolve.includes(reasonUnitId)) {
              unitIdsToResolve.push(reasonUnitId)
            }
          }
        }
      }
    }

    const units = await UnitResolver.fromIds({
      ids: unitIdsToResolve,
    })

    const resolvedPlayerRounds: PlayerRound[] = []
    for (const round of rounds) {
      resolvedPlayerRounds.push(
        await PlayerRoundResolver.fromObject({
          round,
          units,
        })
      )
    }
    return resolvedPlayerRounds
  }
}
