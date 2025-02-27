import { GameDbObject, GamePlayerDbObject } from '@gwent/graphql-schema/database-typings'

export default class PassCurrentPlayer {
  static markPassed({ game }: { game: GameDbObject }): GamePlayerDbObject[] {
    return game.players.map((gamePlayer) => {
      if (gamePlayer.user.toString() === game.turn?.toString()) {
        return {
          ...gamePlayer,
          rounds: gamePlayer.rounds.map((round, index) => {
            if (index === game.round - 1) {
              round.passed = true
            }
            return round
          }),
        }
      }
      return gamePlayer
    })
  }
}
