import { getLogger } from 'log4js'

import { GameDbObject, GameDeckDbObject } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../../../database/stores/game-store'
import PresentableError from '../../../../util/presentable-error'
import SetGameDeck from './set-game-deck'
import { ValidatedSetDeck } from './set-deck-validation'

/**
 * A class for implementing the setDeck GraphQL Mutation.
 */
export default class SetDeckImplementation {
  private static logger = getLogger('SetDeckImplementation')

  /**
   * Save the deck for a game to the database.
   *
   * @param config The configuration used to set the deck.
   * @param config.game The game to set the deck for.
   * @param config.deck The deck to set on the game.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @param config.userId The ID of the User who is setting their deck for the game.
   * @returns The game updated with new deck as well as that new deck.
   * @throws {PresentableError} if known problem setting deck.
   */
  static async setDeckImplementation({ deck, game, logPrefix, userId }: ValidatedSetDeck): Promise<ImplementedSetDeck> {
    SetGameDeck.setGameDeck({
      game,
      deck,
      userId,
      logPrefix,
    })

    const updatedGame = await GameStore.save(game)

    if (SetDeckImplementation.logger.isTraceEnabled()) {
      SetDeckImplementation.logger.trace(`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`)
    }
    if (!updatedGame) {
      const message = 'Could not set deck in probable race condition collision.'
      SetDeckImplementation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    const updatedPlayer = updatedGame.players.find((gamePlayer) => gamePlayer.user.toString() === userId.toString())
    if (SetDeckImplementation.logger.isTraceEnabled()) {
      SetDeckImplementation.logger.trace(`${logPrefix} updatedPlayer: "${JSON.stringify(updatedPlayer)}"`)
    }
    if (!updatedPlayer) {
      const message = 'Could not get player after setting deck.'
      SetDeckImplementation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    return {
      game: updatedGame,
      gameDeck: updatedPlayer.deck,
    }
  }
}

interface ImplementedSetDeck {
  game: GameDbObject
  gameDeck: GameDeckDbObject
}
