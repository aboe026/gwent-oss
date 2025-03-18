import { ObjectId } from 'mongodb'

import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import PresentableError from '../../../../util/presentable-error'
import { getLogger } from 'log4js'

export default class MarkPlayerReady {
  private static logger = getLogger('mark-player-ready')

  static markPlayerReady({ game, userId, logPrefix }: { game: GameDbObject; userId: ObjectId; logPrefix: string }) {
    const player = game.players.find((player) => player.user.toString() === userId.toString())
    if (player) {
      if (player.ready) {
        const message = 'Already marked as ready.'
        MarkPlayerReady.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      } else {
        player.ready = true
      }
    } else {
      const message = `Could not find player "${userId}" on game "${game._id}" to mark as ready.`
      MarkPlayerReady.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
  }
}
