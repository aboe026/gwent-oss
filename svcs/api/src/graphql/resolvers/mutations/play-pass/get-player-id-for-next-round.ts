import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { GameDbObject, GamePlayerDbObject, RoundResult } from '@gwent/graphql-schema/database-typings'
import { sortObjectArray } from '@gwent/utils'

export default class GetPlayerIdForNextRound {
  private static logger = getLogger('GetPlayerIdForNextRound')

  /**
   * Gets the ID of the player whose turn it should be for the start of the next round.
   *
   * @param config The configuration of used to determine who should start the next round.
   * @param config.game The game to determine the started of the next round for.
   * @returns The ID of the player who should start the next round.
   */
  static getPlayerIdForNextRound({ game, logPrefix }: { game: GameDbObject; logPrefix: string }): ObjectId {
    GetPlayerIdForNextRound.logger.trace(`${logPrefix} getPlayerIdForNextRound nextRound: "${game.round + 1}"`)
    const usersByOrder: GamePlayerDbObject[] = sortObjectArray({
      array: game.players,
      sortProperties: ['order'],
    })
    if (GetPlayerIdForNextRound.logger.isTraceEnabled()) {
      GetPlayerIdForNextRound.logger.trace(
        `${logPrefix} getPlayerIdForNextRound usersByOrder: "${JSON.stringify(usersByOrder)}"`
      )
    }

    // see if single winner of last round. If so, they start
    const roundWinners = game.players.filter(
      (gamePlayer) => gamePlayer.rounds[game.round - 1].result === RoundResult.Won
    )
    if (GetPlayerIdForNextRound.logger.isTraceEnabled()) {
      GetPlayerIdForNextRound.logger.trace(
        `${logPrefix} getPlayerIdForNextRound roundWinners: "${JSON.stringify(
          roundWinners.map((roundWinner) => roundWinner.user)
        )}"`
      )
    }
    if (roundWinners.length === 1) {
      const nextUser = roundWinners[0].user
      GetPlayerIdForNextRound.logger.debug(
        `${logPrefix} getPlayerIdForNextRound single user "${nextUser}" won round "${
          game.round
        }", setting them as player for round "${game.round + 1}"`
      )
      return nextUser
    }

    const nextUser = usersByOrder[game.round % game.players.length].user
    GetPlayerIdForNextRound.logger.debug(
      `${logPrefix} getPlayerIdForNextRound no single user won round "${
        game.round
      }", setting next player as "${nextUser}" for round "${game.round + 1}" based on game order`
    )
    return nextUser
  }
}
