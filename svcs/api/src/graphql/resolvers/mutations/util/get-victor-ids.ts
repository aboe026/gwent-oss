import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { GameDbObject, RoundResult } from '@gwent/graphql-schema/database-typings'

export default class GetVictorIds {
  private static logger = getLogger('GetVictorIds')

  static getVictorIds({ game, logPrefix }: { game: GameDbObject; logPrefix: string }): ObjectId[] {
    let highestWins = 0
    for (const gamePlayer of game.players) {
      const playerWins = gamePlayer.rounds.filter((round) => round.result === RoundResult.Won).length
      GetVictorIds.logger.trace(`${logPrefix} player "${gamePlayer.user}" playerWins: "${playerWins}"`)
      if (playerWins > highestWins) {
        GetVictorIds.logger.trace(
          `${logPrefix} player "${gamePlayer.user}" wins "${playerWins}" is greater than previous highestWins of "${highestWins}", setting high wins to theirs`
        )
        highestWins = playerWins
      }
    }
    GetVictorIds.logger.trace(`${logPrefix} highestWins: "${highestWins}"`)
    const victorIds: ObjectId[] = []
    for (const gamePlayer of game.players) {
      const playerWins = gamePlayer.rounds.filter((round) => round.result === RoundResult.Won).length
      if (playerWins === highestWins) {
        victorIds.push(gamePlayer.user)
      }
    }
    GetVictorIds.logger.debug(`${logPrefix} ends game in victory for "${JSON.stringify(victorIds)}"`)
    return victorIds
  }
}
