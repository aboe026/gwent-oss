import { GameDbObject, GameUnitDbObject } from '@gwent/graphql-schema/database-typings'

export default class CalculateGameScores {
  static calculateScores({ game }: { game: GameDbObject }) {
    for (const player of game.players) {
      const round = player.rounds[game.round - 1]
      round.close.score = CalculateGameScores.calculateScoreForRow({
        units: round.close.units,
      })
      round.ranged.score = CalculateGameScores.calculateScoreForRow({
        units: round.ranged.units,
      })
      round.siege.score = CalculateGameScores.calculateScoreForRow({
        units: round.siege.units,
      })
      round.score = round.close.score + round.ranged.score + round.siege.score
    }
  }

  private static calculateScoreForRow({ units: units }: { units: GameUnitDbObject[] }): number {
    let score = 0
    for (const unit of units) {
      score += unit.effectiveStrength || 0
    }
    return score
  }
}
