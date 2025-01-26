import { DeckUnit, GameUnit, Leader, Move, PlayerRound, RoundResult } from '@gwent/graphql-schema/resolver-typings'
import {
  GameUnitDbObject,
  MoveLeaderDbObject,
  MoveUnitDbObject,
  PlayerRoundDbObject,
} from '@gwent/graphql-schema/database-typings'
import GameUnitResolver from './game-unit-resolver'
import { MoveType } from '@gwent/graphql-schema'
import PlayerMoveResolver from './player-move-resolver'

export default class PlayerRoundResolver {
  static async fromObject({
    round,
    gameUnits,
    leader,
  }: {
    round: PlayerRoundDbObject
    gameUnits?: GameUnit[]
    leader?: Leader
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
    const moves: Move[] = []
    for (const move of round.moves) {
      let deckUnit: DeckUnit | undefined = undefined
      if (move.type === MoveType.Unit) {
        const gameUnit = resolvedGameUnits.find(
          (gameUnit) => gameUnit.unit.id === (move as MoveUnitDbObject).unit.unit.toString()
        )
        if (gameUnit) {
          deckUnit = {
            artStyle: gameUnit.artStyle,
            unit: gameUnit.unit,
          }
        }
      }
      let moveLeader: Leader | undefined = undefined
      if (move.type === MoveType.Leader) {
        if (leader && leader.id === (move as MoveLeaderDbObject).leader.toString()) {
          moveLeader = leader
        }
      }
      moves.push(
        await PlayerMoveResolver.fromObject({
          move,
          deckUnit,
          leader: moveLeader,
        })
      )
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
      moves,
      passed: round.passed,
    }
  }

  static async fromArray({
    rounds,
    leader,
  }: {
    rounds: PlayerRoundDbObject[]
    leader?: Leader
  }): Promise<PlayerRound[]> {
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
          leader,
        })
      )
    }
    return resolvedPlayerRounds
  }
}
