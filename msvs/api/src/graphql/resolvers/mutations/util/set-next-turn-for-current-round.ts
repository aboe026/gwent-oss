import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { GameDbObject, GamePlayerDbObject } from '@gwent/graphql-schema/database-typings'
import PresentableError from '../../../../util/presentable-error'
import { sortObjectArray } from '@gwent/utils'

/**
 * A class for setting the turn of a Game in the current Game round.
 */
export default class SetNextTurnForCurrentRound {
  private static logger = getLogger('SetNextTurnForCurrentRound')

  /**
   * Sets the game turn to the player whose turn it is next in the current round.
   *
   * @param config The configuration of used to determine who the next eligible player is on the game.
   * @param config.game The game to set the turn on for the current round.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @throws {PresentableError} if there is a problem getting the next player.
   */
  static setNextTurnForCurrentRound({ game, logPrefix }: { game: GameDbObject; logPrefix: string }) {
    const currentPlayer = game.players.find(
      (gamePlayer) => gamePlayer.user.toString() === game.turn?.toString()
    ) as GamePlayerDbObject

    if (currentPlayer.reviving) {
      SetNextTurnForCurrentRound.logger.debug(
        `${logPrefix} player "${currentPlayer.user}" needs to revive a unit, so keeping them as the current player.`
      )
    } else {
      const usersByOrder: GamePlayerDbObject[] = sortObjectArray({
        array: game.players,
        sortProperties: ['order'],
      })
      if (SetNextTurnForCurrentRound.logger.isTraceEnabled()) {
        SetNextTurnForCurrentRound.logger.trace(`${logPrefix} usersByOrder: "${JSON.stringify(usersByOrder)}"`)
      }
      let nextPlayerId: ObjectId | undefined = undefined
      const currentPlayerOrder = currentPlayer.order
      SetNextTurnForCurrentRound.logger.trace(`${logPrefix} currentPlayerOrder: "${currentPlayerOrder}"`)
      if (currentPlayerOrder === undefined || currentPlayerOrder === null) {
        const message = `Could not determine order of current player "${currentPlayer.user}": "${currentPlayerOrder}".`
        SetNextTurnForCurrentRound.logger.error(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
      for (let i = 0; i < game.players.length && nextPlayerId === undefined; i++) {
        SetNextTurnForCurrentRound.logger.trace(`${logPrefix} i: "${i}"`)
        const potentialNextPlayer = usersByOrder[(currentPlayerOrder + i + 1) % game.players.length]
        if (SetNextTurnForCurrentRound.logger.isTraceEnabled()) {
          SetNextTurnForCurrentRound.logger.trace(
            `${logPrefix} potentialNextPlayer: "${JSON.stringify(potentialNextPlayer)}"`
          )
        }
        if (potentialNextPlayer.rounds[game.round - 1].passed) {
          SetNextTurnForCurrentRound.logger.trace(
            `${logPrefix} player "${potentialNextPlayer.user}" has already passed, ignoring for next player.`
          )
        } else {
          SetNextTurnForCurrentRound.logger.debug(
            `${logPrefix} player "${potentialNextPlayer.user}" has not yet passed, setting as next player.`
          )
          nextPlayerId = potentialNextPlayer.user
        }
      }
      if (!nextPlayerId) {
        const message = `Could not determine next player for round "${game.round}".`
        SetNextTurnForCurrentRound.logger.error(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }

      game.turn = nextPlayerId
    }
  }
}
