import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import InitializeNewRound from './initialize-new-round'
import PresentableError from '../../../../util/presentable-error'

export default class MarkPlayerReady {
  private static logger = getLogger('MarkPlayerReady')

  static markPlayerReady({ game, userId, logPrefix }: { game: GameDbObject; userId: ObjectId; logPrefix: string }) {
    const player = game.players.find((player) => player.user.toString() === userId.toString())
    if (player) {
      if (player.ready) {
        const message = 'Already marked as ready.'
        MarkPlayerReady.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      } else {
        player.ready = true

        const unreadyPlayers = game.players.filter((gamePlayer) => gamePlayer.ready === false)
        if (MarkPlayerReady.logger.isTraceEnabled()) {
          MarkPlayerReady.logger.trace(
            `${logPrefix} unreadyPlayers: "${JSON.stringify(
              unreadyPlayers.map((unreadyPlayer) => unreadyPlayer.user)
            )}"`
          )
        }
        if (unreadyPlayers.length === 0) {
          MarkPlayerReady.logger.debug(`${logPrefix} has all players ready, starting first round.`)
          InitializeNewRound.initializeNewRound({
            game,
          })
          game.status = GameStatus.Playing
        }
      }
    } else {
      const message = `Could not find player "${userId}" on game "${game._id}" to mark as ready.`
      MarkPlayerReady.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
  }
}
