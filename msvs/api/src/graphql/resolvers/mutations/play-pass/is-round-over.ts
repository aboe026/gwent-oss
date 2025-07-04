import { getLogger } from 'log4js'

import { GameDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * A class to determine if the current round of a game is over or not.
 */
export default class IsRoundOver {
  private static logger = getLogger('IsRoundOver')
  /**
   * Whether or not the current round is over.
   *
   * @param config The configuration to determine if the round is over or not.
   * @param config.game The game to check if the current round is over.
   * @param config.logPrefix What to prepend log statements with.
   * @returns True if the current round is over, false otherwise.
   */
  static isRoundOver({ game, logPrefix }: { game: GameDbObject; logPrefix: string }): boolean {
    const currentRound = game.round
    IsRoundOver.logger.trace(`${logPrefix} isRoundOver currentRound: "${currentRound}"`)
    for (const player of game.players) {
      const playerRound = player.rounds[currentRound - 1]
      IsRoundOver.logger.trace(
        `${logPrefix} isRoundOver player "${player.user}" round "${currentRound}" passed: "${playerRound.passed}"`
      )
      if (!playerRound.passed) {
        IsRoundOver.logger.debug(
          `${logPrefix} isRoundOver player "${player.user}" has not passed, so round "${currentRound}" is not over`
        )
        return false
      }
    }

    IsRoundOver.logger.debug(`${logPrefix} isRoundOver all players have passed, so round "${currentRound}" is over`)
    return true
  }
}
