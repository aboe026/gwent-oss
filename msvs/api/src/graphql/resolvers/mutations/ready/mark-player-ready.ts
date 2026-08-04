import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { GameDbObject, GameStatus } from '@gwent-oss/graphql-schema/database-typings'
import initializeNewRound from '../util/initialize-new-round'
import PresentableError from '../../../../util/presentable-error'

/**
 * A class to mark a player as ready for a game.
 */
export default class MarkPlayerReady {
  private static logger = getLogger('MarkPlayerReady')

  /**
   * Mark a player as ready for a game, so a battle can commence.
   *
   * @param config The configuration used to mark the game as ready.
   * @param config.game The game to mark as ready for the player.
   * @param config.userId The ID of the player to mark as ready on the game.
   * @param config.logPrefix What to prefix log statements with to help identify log output.
   */
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
          initializeNewRound({
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
