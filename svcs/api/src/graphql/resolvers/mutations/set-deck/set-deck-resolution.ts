import { getLogger } from 'log4js'

import { DeckSetPayload, GameSetPayload } from '../../subscription-resolver'
import EventManager from '../../../event-manager'
import { FactionKey, GameDbObject, GameDeckDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import { GameDeck } from '@gwent/graphql-schema/resolver-typings'
import GameDeckResolver from '../../types/game-deck-resolver'
import GameResolver from '../../types/game-resolver'
import PresentableError from '../../../../util/presentable-error'
import { PubSubEvents } from '@gwent/constants'
import SetGameTurnOrder from '../util/set-game-turn-order'

/**
 * A class for executing the setDeck GraphQL Mutation.
 */
export default class SetDeckResolution {
  private static logger = getLogger('SetDeckResolution')

  /**
   * Sets a Deck for a Game. Deck cannot be changed after set.
   *
   * @param args The arguments for setting a deck.
   * @param context The session containing the user setting the deck.
   * @param info The information about the GraphQL request.
   * @returns The GameDeck that was set for the game.
   * @throws PresentableError if problem setting deck.
   */
  static async setDeckResolution({
    game,
    gameDeck,
    logPrefix,
  }: {
    game: GameDbObject
    gameDeck: GameDeckDbObject
    logPrefix: string
  }): Promise<GameDeck> {
    const resolvedDeck = await GameDeckResolver.fromObject({
      gameDeck,
    })
    const resolvedGame = await GameResolver.fromObject({
      game,
    })
    if (SetDeckResolution.logger.isTraceEnabled()) {
      SetDeckResolution.logger.trace(`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`)
    }

    EventManager.pubsub.publish(PubSubEvents.DeckSet, {
      deckSet: {
        deck: resolvedDeck,
        game: resolvedGame,
      },
    } as DeckSetPayload)

    if (game.status === GameStatus.Ordering) {
      EventManager.pubsub.publish(PubSubEvents.GameSet, {
        gameSet: resolvedGame,
      } as GameSetPayload)
      try {
        await SetGameTurnOrder.setGameTurnOrder({
          game,
          gameDeck,
          logPrefix: `setOrder via ${logPrefix}`,
          allowImplicit: false,
        })
      } catch (err: unknown) {
        if (
          err instanceof PresentableError &&
          err.message === `Random order not allowed when another player has deck faction of "${FactionKey.ScoiaTael}".`
        ) {
          // swallow
        } else {
          throw err
        }
      }
    }

    return resolvedDeck
  }
}
