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

/**
 * A class to convert PlayerRound database objects to their GraphQL equivalent.
 */
export default class PlayerRoundResolver {
  /**
   * Converts a single PlayerRound database object to a single PlayerRound GraphQL object.
   *
   * @param config The configuration for resolving the PlayerRound.
   * @param config.round The database object to resolve to its GraphQL type.
   * @param config.gameUnits An optional pre-resolved GameUnits. If not specified, will retreive the GameUnits from the databae to resolve.
   * @param config.leader An optional pre-resolved Leader. If not specified, will retreive the Leader from the databae to resolve.
   * @returns The resolved PlayerRound object matching its GraphQL schema definition.
   */
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
          deckUnit = gameUnit as DeckUnit
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
