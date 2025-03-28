import { getLogger } from 'log4js'

import EventManager from '../../../event-manager'
import { Game } from '@gwent/graphql-schema/resolver-typings'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import { GameReadyPayload } from '../../subscription-resolver'
import GameResolver from '../../types/game-resolver'
import { PubSubEvents } from '@gwent/constants'

/**
 * A class for executing the ready GraphQL Mutation.
 */
export default class ReadyResolution {
  private static logger = getLogger('ReadyResolution')

  /**
   * Mark a Game as ready for a User. Prevents redrawing units after marked as ready.
   *
   * @param args The arguments for marking a game as ready.
   * @param context The session containing the user readying the game.
   * @param info The information about the GraphQL request.
   * @returns The Game that is now ready for the user.
   * @throws PresentableError if problem marking game as ready.
   */
  static async readyResolution({ game, logPrefix }: { game: GameDbObject; logPrefix: string }): Promise<Game> {
    const resolvedGame = await GameResolver.fromObject({
      game,
    })
    if (ReadyResolution.logger.isTraceEnabled()) {
      ReadyResolution.logger.trace(`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`)
    }

    EventManager.pubsub.publish(PubSubEvents.GameReady, {
      gameReady: resolvedGame,
    } as GameReadyPayload)

    return resolvedGame
  }
}
