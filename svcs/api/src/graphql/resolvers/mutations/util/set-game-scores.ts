import { GameDbObject, GameUnitDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * Sets the scores for the current round and each combat row in it for the game.
 *
 * @param game The game to set scores for the current round.
 */
export default function setGameScores(game: GameDbObject) {
  for (const player of game.players) {
    const round = player.rounds[game.round - 1]

    round.close.score = getUnitsScore(round.close.units)
    round.ranged.score = getUnitsScore(round.ranged.units)
    round.siege.score = getUnitsScore(round.siege.units)

    round.score = round.close.score + round.ranged.score + round.siege.score
  }
}

/**
 * Gets the collective score of a set of units.
 *
 * @param units The units to calculate the collective score of.
 * @returns The score of all units given.
 */
export function getUnitsScore(units: GameUnitDbObject[]): number {
  let score = 0
  for (const unit of units) {
    score += unit.effectiveStrength || 0
  }
  return score
}
