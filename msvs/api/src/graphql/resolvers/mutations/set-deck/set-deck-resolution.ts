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
 * A class for resolving the setDeck GraphQL Mutation.
 */
export default class SetDeckResolution {
  private static logger = getLogger('SetDeckResolution')

  /**
   * Resolve a game after a deck has been set for it, passing it back on the request and publishing it for subscriptions.
   *
   * @param config The configuration used to resolve the game with deck set.
   * @param config.game The game with the deck set for it.
   * @param config.gameDeck The GameDeck for the user after the deck was set on the game.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @returns The GameDeck that was set for the game with fields resolved.
   * @throws {PresentableError} if known problem setting deck.
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
    const resolvedGameDeck = await GameDeckResolver.fromObject({
      gameDeck,
    })
    if (SetDeckResolution.logger.isTraceEnabled()) {
      SetDeckResolution.logger.trace(`${logPrefix} resolvedGameDeck: "${JSON.stringify(resolvedGameDeck)}"`)
    }
    const resolvedGame = await GameResolver.fromObject({
      game,
    })
    if (SetDeckResolution.logger.isTraceEnabled()) {
      SetDeckResolution.logger.trace(`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`)
    }

    EventManager.pubsub.publish(PubSubEvents.DeckSet, {
      deckSet: {
        deck: resolvedGameDeck,
        game: resolvedGame,
      },
    } as DeckSetPayload)

    if (game.status === GameStatus.Ordering) {
      SetDeckResolution.logger.debug(`${logPrefix} All decks set, attempting to set order automatically.`)
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
          const message = 'Could not set game turn order automatically'
          SetDeckResolution.logger.error(`${logPrefix} failed: ${message}: ${err}`)
          throw new PresentableError(`${message}.`)
        }
      }
    }

    return resolvedGameDeck
  }
}
