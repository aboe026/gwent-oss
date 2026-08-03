import { getLogger } from 'log4js'

import { GameDbObject } from '@gwent-oss/graphql-schema/database-typings'
import GameStore from '../../../../database/stores/game-store'
import MarkPlayerReady from './mark-player-ready'
import PresentableError from '../../../../util/presentable-error'
import { ValidatedReady } from './ready-validation'

/**
 * A class for implementing the ready GraphQL Mutation.
 */
export default class ReadyImplementation {
  private static logger = getLogger('ReadyImplementation')

  /**
   * Mark a Game as ready for a User, saving the impact that has on the game to the database.
   *
   * @param config The configuration used to mark the game as ready.
   * @param config.game The game to mark as ready for.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @param config.userId The ID of the User to mark as ready on the game.
   * @returns The Game that is now ready for the user.
   * @throws {PresentableError} if known problem marking game as ready.
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
