import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { DeckDbObject, GameDbObject, GameDeckDbObject } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../../../database/stores/game-store'
import PresentableError from '../../../../util/presentable-error'
import SetGameDeck from './set-game-deck'

/**
 * A class for executing the setDeck GraphQL Mutation.
 */
export default class SetDeckImplementation {
  private static logger = getLogger('SetDeckImplementation')

  /**
   * Sets a Deck for a Game. Deck cannot be changed after set.
   *
   * @param args The arguments for setting a deck.
   * @param context The session containing the user setting the deck.
   * @param info The information about the GraphQL request.
   * @returns The GameDeck that was set for the game.
   * @throws PresentableError if problem setting deck.
   */
  static async setDeckImplementation({
    deck,
    game,
    logPrefix,
    userId,
  }: {
    deck: DeckDbObject
    game: GameDbObject
    logPrefix: string
    userId: ObjectId
  }): Promise<ImplementedSetDeck> {
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
