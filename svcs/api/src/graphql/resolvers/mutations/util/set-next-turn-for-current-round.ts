import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { GameDbObject, GamePlayerDbObject } from '@gwent/graphql-schema/database-typings'
import PresentableError from '../../../../util/presentable-error'
import { sortObjectArray } from '@gwent/utils'

export default class SetNextTurnForCurrentRound {
  private static logger = getLogger('SetNextTurnForCurrentRound')
  /**
   * Gets the ID of the player whose turn it is next in the current round.
   *
   * @param config The configuration of used to determine who the next eligible player is on the game.
   * @param config.currentRound The current round the game is on.
   * @param config.players The GamePlayers on the game.
   * @param config.currentTurn The game player whose turn it currently is.
   * @returns The ID of the player whose turn is next, otherwise an Error.
   * @throws PresentableError if there is a problem getting the next player.
   */
  static setNextTurnForCurrentRound({ game, logPrefix }: { game: GameDbObject; logPrefix: string }) {
    const usersByOrder: GamePlayerDbObject[] = sortObjectArray({
      array: game.players,
      sortProperties: ['order'],
    })
    if (SetNextTurnForCurrentRound.logger.isTraceEnabled()) {
      SetNextTurnForCurrentRound.logger.trace(`${logPrefix} usersByOrder: "${JSON.stringify(usersByOrder)}"`)
    }
    const currentPlayer = game.players.find(
      (gamePlayer) => gamePlayer.user.toString() === game.turn?.toString()
    ) as GamePlayerDbObject
    let nextPlayerId: ObjectId | undefined = undefined
    const currentPlayerOrder = currentPlayer.order
    SetNextTurnForCurrentRound.logger.trace(`${logPrefix} currentPlayerOrder: "${currentPlayerOrder}"`)
    if (currentPlayerOrder === undefined || currentPlayerOrder === null) {
      const message = `Could not determine order of current player "${currentPlayer.user}": "${currentPlayerOrder}".`
      SetNextTurnForCurrentRound.logger.error(`${logPrefix} setNextTurnForCurrentRound failed: ${message}`)
      throw new PresentableError(message)
    }
    for (let i = 0; i < game.players.length && nextPlayerId === undefined; i++) {
      SetNextTurnForCurrentRound.logger.trace(`${logPrefix} setNextTurnForCurrentRound i: "${i}"`)
      if (currentPlayer.order !== undefined) {
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
    }
    if (!nextPlayerId) {
      const message = `Could not determine next player for round "${game.round}".`
      SetNextTurnForCurrentRound.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    game.turn = nextPlayerId
  }
}
