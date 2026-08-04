import { getLogger } from 'log4js'

import { GameDbObject } from '@gwent-oss/graphql-schema/database-typings'
import GameStore from '../../../../database/stores/game-store'
import { ValidatedAddGame } from './add-game-validation'

/**
 * A class for implementing the addGame GraphQL Mutation.
 */
export default class AddGameImplementation {
  private static logger = getLogger('AddGameImplementation')

  /**
   * Add a Game for a user, saving it to the database.
   *
   * @param config The configuration used to add the game.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @param config.opponents The names of the opponents to participate in the game.
   * @param config.userId The ID of the user creating the game.
   * @returns The Game that was added.
   */
  static async AddGameImplementation({ logPrefix, opponents, userId }: ValidatedAddGame): Promise<GameDbObject> {
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
