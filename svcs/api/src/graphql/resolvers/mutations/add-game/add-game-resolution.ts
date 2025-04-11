import { getLogger } from 'log4js'

import EventManager from '../../../event-manager'
import { Game, User } from '@gwent/graphql-schema/resolver-typings'
import { GameAddedPayload } from '../../subscription-resolver'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import GameResolver from '../../types/game-resolver'
import { PubSubEvents } from '@gwent/constants'

/**
 * A class for resolving the addGame GraphQL Mutation.
 */
export default class AddGameResolution {
  private static logger = getLogger('AddGameResolution')

  /**
   * Resolve a newly added game for a user, passing it back on the request and publishing it for subscriptions.
   *
   * @param config The configuration used to resolve the new game.
   * @param config.game The new game that was added.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @param config.opponents The name of the opponents participating in the game.
   * @returns The Game that was added with fields resolved.
   */
  static async addGameResolution({
    game,
    logPrefix,
    opponents,
  }: {
    game: GameDbObject
    logPrefix: string
    opponents: User[]
  }): Promise<Game> {
    const resolvedGame = await GameResolver.fromObject({
      game,
      users: opponents,
    })

    if (AddGameResolution.logger.isTraceEnabled()) {
      AddGameResolution.logger.trace(`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`)
    }

    EventManager.pubsub.publish(PubSubEvents.GameAdded, {
      gameAdded: resolvedGame,
    } as GameAddedPayload)

    return resolvedGame
  }
}
