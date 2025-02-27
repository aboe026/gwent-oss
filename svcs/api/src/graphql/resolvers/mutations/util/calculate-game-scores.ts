import { GameDbObject, GamePlayerDbObject, PlayerCombatRowDbObject } from '@gwent/graphql-schema/database-typings'

export default class CalculateGameScores {
  static calculateScores({ game }: { game: GameDbObject }): GamePlayerDbObject[] {
    return game.players.map((player) => {
      return {
        ...player,
        rounds: player.rounds.map((round, index) => {
          if (index === game.round - 1) {
            round.close.score = CalculateGameScores.calculateScoreForRow({
              row: round.close,
            })
            round.ranged.score = CalculateGameScores.calculateScoreForRow({
              row: round.ranged,
            })
            round.siege.score = CalculateGameScores.calculateScoreForRow({
              row: round.siege,
            })
            round.score = round.close.score + round.ranged.score + round.siege.score
          }
          return round
        }),
      }
    })
  }

  private static calculateScoreForRow({ row }: { row: PlayerCombatRowDbObject }): number {
    let score = 0
    for (const unit of row.units) {
      score += unit.effectiveStrength || 0
    }
    return score
  }
}
