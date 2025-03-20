import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { DeckDbObject, GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import { getRandomSubset } from '@gwent/utils'
import PresentableError from '../../../../util/presentable-error'
import { STARTING_HAND_SIZE } from '@gwent/constants'

/**
 * The class for setting the deck on a game.
 */
export default class SetGameDeck {
  private static logger = getLogger('SetGameDeck')

  /**
   * Sets the deck on a game, randomizing the starting hand for the user.
   *
   * @param config The configuration used to set the deck on the game.
   * @param config.game The game to set the deck on.
   * @param config.userId The ID of the player on the game to set the deck for.
   * @param config.deck The Deck that should be set for the player on the game.
   * @param logPrefix What to prefix log statements with to help identify log output.
   */
  static setGameDeck({
    game,
    userId,
    deck,
    logPrefix,
  }: {
    game: GameDbObject
    userId: ObjectId
    deck: DeckDbObject
    logPrefix: string
  }) {
    const player = game.players.find((player) => player.user.toString() === userId.toString())
    if (player) {
      player.deck.from = deck
      player.deck.hand = getRandomSubset({
        items: deck.units,
        size: STARTING_HAND_SIZE,
      })
      const handIds = player.deck.hand.map((deckUnit) => deckUnit.unit.toString())
      player.deck.undrawn = deck.units.filter((deckUnit) => !handIds.includes(deckUnit.unit.toString()))

      const allDecksSet = !game.players.some((gamePlayer) => !gamePlayer.deck.from)
      if (allDecksSet) {
        SetGameDeck.logger.debug(`${logPrefix} all decks set, changing game status to "${GameStatus.Ordering}"`)
        game.status = GameStatus.Ordering
      }
    } else {
      const message = `Could not find player "${userId}" on game "${game._id}" to set deck to "${deck._id}".`
      SetGameDeck.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
  }
}
