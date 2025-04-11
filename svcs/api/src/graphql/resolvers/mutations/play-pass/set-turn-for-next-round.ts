import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { GameDbObject, GamePlayerDbObject, RoundResult } from '@gwent/graphql-schema/database-typings'
import { sortObjectArray } from '@gwent/utils'

export default class SetTurnForNextRound {
  private static logger = getLogger('SetTurnForNextRound')

  /**
   * Sets the turn on the game to the player whose turn it should be for the start of the next round.
   *
   * @param config The configuration of used to determine who should start the next round.
   * @param config.game The game to determine the started of the next round for.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   */
  static setTurnForNextRound({ game, logPrefix }: { game: GameDbObject; logPrefix: string }) {
    let nextRoundUser: ObjectId
    SetTurnForNextRound.logger.trace(`${logPrefix} nextRound: "${game.round + 1}"`)
    const usersByOrder: GamePlayerDbObject[] = sortObjectArray({
      array: game.players,
      sortProperties: ['order'],
    })
    if (SetTurnForNextRound.logger.isTraceEnabled()) {
      SetTurnForNextRound.logger.trace(`${logPrefix} usersByOrder: "${JSON.stringify(usersByOrder)}"`)
    }

    // see if single winner of last round. If so, they start
    const roundWinners = game.players.filter(
      (gamePlayer) => gamePlayer.rounds[game.round - 1].result === RoundResult.Won
    )
    if (SetTurnForNextRound.logger.isTraceEnabled()) {
      SetTurnForNextRound.logger.trace(
        `${logPrefix} roundWinners: "${JSON.stringify(roundWinners.map((roundWinner) => roundWinner.user))}"`
      )
    }

    if (roundWinners.length === 1) {
      nextRoundUser = roundWinners[0].user
      SetTurnForNextRound.logger.debug(
        `${logPrefix} single user "${nextRoundUser}" won round "${game.round}", setting them as player for round "${
          game.round + 1
        }"`
      )
    } else {
      nextRoundUser = usersByOrder[game.round % game.players.length].user
      SetTurnForNextRound.logger.debug(
        `${logPrefix} no single user won round "${game.round}", setting next player as "${nextRoundUser}" for round "${
          game.round + 1
        }" based on game order`
      )
    }

    game.turn = nextRoundUser
  }
}
