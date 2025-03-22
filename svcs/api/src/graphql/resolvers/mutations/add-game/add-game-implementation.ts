import { getLogger } from 'log4js'

import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../../../database/stores/game-store'
import { ValidatedAddGame } from './add-game-validation'

/**
 * A class for executing the addGame GraphQL Mutation.
 */
export default class AddGameImplementation {
  private static logger = getLogger('AddGameImplementation')

  /**
   * Add a Game for a user.
   *
   * @param args The arguments for adding a game.
   * @param context The session containing the user adding the game.
   * @param info The information about the GraphQL request.
   * @returns The Game that was added.
   * @throws PresentableError if problem adding game.
   */
  static async AddGameImplementation({ userId, opponents, logPrefix }: ValidatedAddGame): Promise<GameDbObject> {
    const game = await GameStore.add({
      creatorId: userId,
      opponentIds: opponents.map((opponent) => opponent.id),
    })
    if (AddGameImplementation.logger.isTraceEnabled()) {
      AddGameImplementation.logger.trace(`${logPrefix} game: "${JSON.stringify(game)}"`)
    }

    return game
  }
}
