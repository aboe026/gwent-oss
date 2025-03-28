import { getLogger } from 'log4js'

import EventManager from '../../../event-manager'
import { Game, User } from '@gwent/graphql-schema/resolver-typings'
import { GameAddedPayload } from '../../subscription-resolver'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import GameResolver from '../../types/game-resolver'
import { PubSubEvents } from '@gwent/constants'

/**
 * A class for executing the addGame GraphQL Mutation.
 */
export default class AddGameResolution {
  private static logger = getLogger('AddGameResolution')

  /**
   * Add a Game for a user.
   *
   * @param args The arguments for adding a game.
   * @param context The session containing the user adding the game.
   * @param info The information about the GraphQL request.
   * @returns The Game that was added.
   * @throws PresentableError if problem adding game.
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
