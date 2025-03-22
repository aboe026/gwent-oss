import { getLogger } from 'log4js'

import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../../../database/stores/game-store'
import MarkPlayerReady from './mark-player-ready'
import PresentableError from '../../../../util/presentable-error'
import { ValidatedReady } from './ready-validation'

/**
 * A class for executing the ready GraphQL Mutation.
 */
export default class ReadyImplementation {
  private static logger = getLogger('ReadyImplementation')

  /**
   * Mark a Game as ready for a User. Prevents redrawing units after marked as ready.
   *
   * @param args The arguments for marking a game as ready.
   * @param context The session containing the user readying the game.
   * @param info The information about the GraphQL request.
   * @returns The Game that is now ready for the user.
   * @throws PresentableError if problem marking game as ready.
   */
  static async readyImplementation({ logPrefix, game, userId }: ValidatedReady): Promise<GameDbObject> {
    MarkPlayerReady.markPlayerReady({
      game,
      userId,
      logPrefix,
    })

    const updatedGame = await GameStore.save(game)

    if (ReadyImplementation.logger.isTraceEnabled()) {
      ReadyImplementation.logger.trace(`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`)
    }
    if (!updatedGame) {
      const message = 'Could not set player as ready in probable race condition collision.'
      ReadyImplementation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    return updatedGame
  }
}
