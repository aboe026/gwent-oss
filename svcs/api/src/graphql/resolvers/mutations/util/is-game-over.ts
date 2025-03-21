import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { GameDbObject, RoundResult } from '@gwent/graphql-schema/database-typings'

/**
 * A class to determine if a game is over or not.
 */
export default class IsGameOver {
  private static logger = getLogger('IsGameOver')

  /**
   * Whether or not the game is over.
   *
   * @param config The configuration to determine if the game is over or not.
   * @param config.game The game to check if is finished.
   * @returns True if the game is over, false otherwise.
   */
  static isGameOver({ game, logPrefix }: { game: GameDbObject; logPrefix: string }): boolean {
    const currentRound = game.round
    IsGameOver.logger.trace(`${logPrefix} isGameOver currentRound: "${currentRound}"`)
    IsGameOver.logger.trace(`${logPrefix} isGameOver lives: "${game.config.lives}"`)
    const playersWithLivesLeft: ObjectId[] = []
    for (const player of game.players) {
      const playerLosses = player.rounds.filter(
        (round) => round.result === RoundResult.Lost || round.result === RoundResult.Drew
      ).length
      IsGameOver.logger.trace(`${logPrefix} isGameOver player "${player.user}" losses: "${playerLosses}"`)
      const livesLeft = game.config.lives - playerLosses
      IsGameOver.logger.trace(`${logPrefix} isGameOver player "${player.user}" livesLeft: "${livesLeft}"`)
      if (livesLeft > 0) {
        playersWithLivesLeft.push(player.user)
      }
    }
    if (IsGameOver.logger.isTraceEnabled()) {
      IsGameOver.logger.trace(`${logPrefix} isGameOver playersWithLivesLeft: "${JSON.stringify(playersWithLivesLeft)}"`)
    }
    const gameOver = playersWithLivesLeft.length <= 1
    IsGameOver.logger.debug(
      `${logPrefix} isGameOver game is ${gameOver ? 'now complete' : 'not yet over'} because there are "${
        playersWithLivesLeft.length
      }" player(s) with lives left.`
    )
    return gameOver
  }
}
