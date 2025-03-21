import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { GamePlayerDbObject } from '@gwent/graphql-schema/database-typings'
import PresentableError from '../../../../util/presentable-error'
import { sortObjectArray } from '@gwent/utils'

export default class GetNextPlayerIdForCurrentRound {
  private static logger = getLogger('GetNextPlayerIdForCurrentRound')
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
  static getNextPlayerIdForCurrentRound({
    currentRound,
    players,
    currentTurn,
    logPrefix,
  }: {
    currentRound: number
    players: GamePlayerDbObject[]
    currentTurn: ObjectId | undefined
    logPrefix: string
  }): ObjectId {
    const usersByOrder: GamePlayerDbObject[] = sortObjectArray({
      array: players,
      sortProperties: ['order'],
    })
    if (GetNextPlayerIdForCurrentRound.logger.isTraceEnabled()) {
      GetNextPlayerIdForCurrentRound.logger.trace(
        `${logPrefix} getNextPlayerIdForCurrentRound usersByOrder: "${JSON.stringify(usersByOrder)}"`
      )
    }
    const currentPlayer = players.find(
      (gamePlayer) => gamePlayer.user.toString() === currentTurn?.toString()
    ) as GamePlayerDbObject
    let nextPlayerId: ObjectId | undefined = undefined
    const currentPlayerOrder = currentPlayer.order
    GetNextPlayerIdForCurrentRound.logger.trace(
      `${logPrefix} getNextPlayerIdForCurrentRound currentPlayerOrder: "${currentPlayerOrder}"`
    )
    if (currentPlayerOrder === undefined || currentPlayerOrder === null) {
      const message = `Could not determine order of current player "${currentPlayer.user}": "${currentPlayerOrder}".`
      GetNextPlayerIdForCurrentRound.logger.error(`${logPrefix} getNextPlayerIdForCurrentRound failed: ${message}`)
      throw new PresentableError(message)
    }
    for (let i = 0; i < players.length && nextPlayerId === undefined; i++) {
      GetNextPlayerIdForCurrentRound.logger.trace(`${logPrefix} getNextPlayerIdForCurrentRound i: "${i}"`)
      if (currentPlayer.order !== undefined) {
        const potentialNextPlayer = usersByOrder[(currentPlayerOrder + i + 1) % players.length]
        if (GetNextPlayerIdForCurrentRound.logger.isTraceEnabled()) {
          GetNextPlayerIdForCurrentRound.logger.trace(
            `${logPrefix} getNextPlayerIdForCurrentRound potentialNextPlayer: "${JSON.stringify(potentialNextPlayer)}"`
          )
        }
        if (potentialNextPlayer.rounds[currentRound - 1].passed) {
          GetNextPlayerIdForCurrentRound.logger.trace(
            `${logPrefix} getNextPlayerIdForCurrentRound player "${potentialNextPlayer.user}" has already passed, ignoring for next player.`
          )
        } else {
          GetNextPlayerIdForCurrentRound.logger.debug(
            `${logPrefix} getNextPlayerIdForCurrentRound player "${potentialNextPlayer.user}" has not yet passed, setting as next player.`
          )
          nextPlayerId = potentialNextPlayer.user
        }
      }
    }
    if (!nextPlayerId) {
      const message = `Could not determine next player for round "${currentRound}".`
      GetNextPlayerIdForCurrentRound.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    return nextPlayerId
  }
}
