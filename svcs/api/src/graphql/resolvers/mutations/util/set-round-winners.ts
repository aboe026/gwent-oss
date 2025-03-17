import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { GameDbObject, RoundResult } from '@gwent/graphql-schema/database-typings'

export default class SetRoundWinners {
  private static logger = getLogger('SetRoundWinners')

  static setRoundWinners({ game, logPrefix }: { game: GameDbObject; logPrefix: string }) {
    let highestScore = 0
    let usersWithHighestScore = 0
    for (const player of game.players) {
      const playerRound = player.rounds[game.round - 1]
      const roundScore = playerRound.score
      SetRoundWinners.logger.trace(`${logPrefix} player "${player.user}" round "${game.round}" score: "${roundScore}"`)
      if (roundScore > highestScore) {
        SetRoundWinners.logger.trace(
          `${logPrefix} player "${player.user}" round "${game.round}" score "${roundScore}" is greater than previous highestScore of "${highestScore}", setting it to theirs`
        )
        highestScore = roundScore
        usersWithHighestScore = 1
      } else if (roundScore === highestScore) {
        usersWithHighestScore++
      }
    }
    SetRoundWinners.logger.trace(`${logPrefix} round "${game.round}" highestScore: "${highestScore}"`)
    SetRoundWinners.logger.trace(`${logPrefix} round "${game.round}" usersWithHighestScore: "${usersWithHighestScore}"`)

    const winners: ObjectId[] = []
    for (const player of game.players) {
      const round = player.rounds[game.round - 1]
      let result = round.result
      if (round.score === highestScore) {
        if (usersWithHighestScore > 1) {
          result = RoundResult.Drew
        } else {
          result = RoundResult.Won
        }
      } else {
        result = RoundResult.Lost
      }
      SetRoundWinners.logger.trace(`${logPrefix} player "${player.user}" round "${game.round}" result: "${result}"`)
      round.result = result
      if (result === RoundResult.Won || result === RoundResult.Drew) {
        winners.push(player.user)
      }
    }

    SetRoundWinners.logger.debug(
      `${logPrefix} ends round "${game.round}" in ${winners.length === 1 ? 'win' : 'draw'} for "${JSON.stringify(
        winners
      )}"`
    )
  }
}
