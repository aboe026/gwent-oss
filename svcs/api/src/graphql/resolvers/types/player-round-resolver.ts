import { GameUnitDbObject, PlayerRoundDbObject } from '@gwent/graphql-schema/database-typings'
import { GameUnit, PlayerRound, RoundResult } from '@gwent/graphql-schema/resolver-typings'
import GameUnitResolver from './game-unit-resolver'

export default class PlayerRoundResolver {
  static async fromObject({
    round,
    gameUnits,
  }: {
    round: PlayerRoundDbObject
    gameUnits?: GameUnit[]
  }): Promise<PlayerRound> {
    let resolvedGameUnits: GameUnit[] = []
    if (gameUnits) {
      resolvedGameUnits = gameUnits
    } else {
      const gameUnits: GameUnitDbObject[] = []
      for (const close of round.close.units) {
        gameUnits.push(close)
      }
      for (const ranged of round.ranged.units) {
        gameUnits.push(ranged)
      }
      for (const siege of round.siege.units) {
        gameUnits.push(siege)
      }
      resolvedGameUnits = await GameUnitResolver.fromArray({
        gameUnits,
      })
    }
    return {
      close: {
        score: round.close.score,
        units: round.close.units.map(
          (gameUnit) =>
            resolvedGameUnits.find(
              (resolvedGameUnit) => resolvedGameUnit.unit.id === gameUnit.unit.toString()
            ) as GameUnit
        ),
      },
      ranged: {
        score: round.ranged.score,
        units: round.ranged.units.map(
          (gameUnit) =>
            resolvedGameUnits.find(
              (resolvedGameUnit) => resolvedGameUnit.unit.id === gameUnit.unit.toString()
            ) as GameUnit
        ),
      },
      siege: {
        score: round.siege.score,
        units: round.siege.units.map(
          (gameUnit) =>
            resolvedGameUnits.find(
              (resolvedGameUnit) => resolvedGameUnit.unit.id === gameUnit.unit.toString()
            ) as GameUnit
        ),
      },
      score: round.score,
      result: round.result ? (round.result as RoundResult) : undefined,
      moves: round.moves,
      passed: round.passed,
    }
  }

  static async fromArray({ rounds }: { rounds: PlayerRoundDbObject[] }): Promise<PlayerRound[]> {
    const gameUnits: GameUnitDbObject[] = []
    for (const round of rounds) {
      for (const close of round.close.units) {
        gameUnits.push(close)
      }
      for (const ranged of round.ranged.units) {
        gameUnits.push(ranged)
      }
      for (const siege of round.siege.units) {
        gameUnits.push(siege)
      }
    }
    const resolvedGameUnits = await GameUnitResolver.fromArray({
      gameUnits,
    })

    const resolvedPlayerRounds: PlayerRound[] = []
    for (const round of rounds) {
      resolvedPlayerRounds.push(
        await PlayerRoundResolver.fromObject({
          round,
          gameUnits: resolvedGameUnits,
        })
      )
    }
    return resolvedPlayerRounds
  }
}
