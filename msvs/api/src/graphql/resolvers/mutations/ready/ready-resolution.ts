import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import EventManager from '../../../event-manager'
import { Game } from '@gwent/graphql-schema/resolver-typings'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import { GameReadyPayload } from '../../subscription-resolver'
import GameResolver from '../../types/game-resolver'
import { PubSubEvents } from '@gwent/constants'

/**
 * A class for resolving the ready GraphQL Mutation.
 */
export default class ReadyResolution {
  private static logger = getLogger('ReadyResolution')

  /**
   * Resolve a game after it is marked as ready by a user, passing it back on the request and publishing it for subscriptions.
   *
   * @param config The configuration used to resolve the game marked as ready.
   * @param config.game The game with the impact of the ready applied.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @param config.userId The ID of the user readying the Game.
   * @returns The Game that is now ready for the user with fields resolved.
   */
  static async readyResolution({
    game,
    logPrefix,
    userId,
  }: {
    game: GameDbObject
    logPrefix: string
    userId: ObjectId
  }): Promise<Game> {
    const resolvedGame = await GameResolver.fromObject({
      game,
    })
    if (ReadyResolution.logger.isTraceEnabled()) {
      ReadyResolution.logger.trace(`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`)
    }

    EventManager.pubsub.publish(PubSubEvents.GameReady, {
      gameReady: resolvedGame,
    } as GameReadyPayload)

    return GameResolver.maskSpiedHandUnits({
      game: resolvedGame,
      userId,
    })
  }
}
