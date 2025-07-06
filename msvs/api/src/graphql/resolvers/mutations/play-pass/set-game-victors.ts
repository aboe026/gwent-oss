import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { GameDbObject, GameStatus, RoundResult } from '@gwent/graphql-schema/database-typings'

/**
 * A class to set the victors on a game when it is over.
 */
export default class SetGameVictors {
  private static logger = getLogger('SetGameVictors')

  /**
   * Set the victors on a game base on round winners, marking the game as DONE.
   *
   * @param config The configuration used to set the victors on the game.
   * @param config.game The game to set the victors for.
   * @param config.logPrefix What to prefix log statements with to help identify log output.
   */
  static setGameVictors({ game, logPrefix }: { game: GameDbObject; logPrefix: string }) {
    let highestWins = 0
    for (const gamePlayer of game.players) {
      const playerWins = gamePlayer.rounds.filter((round) => round.result === RoundResult.Won).length
      SetGameVictors.logger.trace(`${logPrefix} player "${gamePlayer.user}" playerWins: "${playerWins}"`)
      if (playerWins > highestWins) {
        SetGameVictors.logger.trace(
          `${logPrefix} player "${gamePlayer.user}" wins "${playerWins}" is greater than previous highestWins of "${highestWins}", setting high wins to theirs`
        )
        highestWins = playerWins
      }
    }
    SetGameVictors.logger.trace(`${logPrefix} highestWins: "${highestWins}"`)

    const victorIds: ObjectId[] = []
    for (const gamePlayer of game.players) {
      const playerWins = gamePlayer.rounds.filter((round) => round.result === RoundResult.Won).length
      if (playerWins === highestWins) {
        victorIds.push(gamePlayer.user)
      }
    }
    SetGameVictors.logger.debug(`${logPrefix} ends game in victory for "${JSON.stringify(victorIds)}"`)

    game.victors = victorIds
    game.status = GameStatus.Done
  }
}
