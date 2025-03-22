import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { DeckSetPayload, GameSetPayload } from '../../subscription-resolver'
import EventManager from '../../../event-manager'
import { GameDeck, MutationSetDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import GameDeckResolver from '../../types/game-deck-resolver'
import GameResolver from '../../types/game-resolver'
import { FactionKey, GameStatus } from '@gwent/graphql-schema/database-typings'
import { GraphQLResolveInfo } from 'graphql'
import PresentableError from '../../../../util/presentable-error'
import { PubSubEvents } from '@gwent/constants'
import SetDeckImplementation from './set-deck-implementation'
import SetDeckValidation from './set-deck-validation'
import SetGameTurnOrder from '../util/set-game-turn-order'

/**
 * A class for executing the setDeck GraphQL Mutation.
 */
export default class SetDeckMutation {
  private static logger = getLogger('SetDeckMutation')

  /**
   * Sets a Deck for a Game. Deck cannot be changed after set.
   *
   * @param args The arguments for setting a deck.
   * @param context The session containing the user setting the deck.
   * @param info The information about the GraphQL request.
   * @returns The GameDeck that was set for the game.
   * @throws PresentableError if problem setting deck.
   */
  static async setDeckMutation(
    args: MutationSetDeckArgs,
    context: Context,
    info: GraphQLResolveInfo
  ): Promise<GameDeck> {
    const {
      deck,
      game,
      logPrefix,
      userId, //
    } = await SetDeckValidation.setDeckValidation(args, context, info)

    const {
      gameDeck,
      game: updatedGame, //
    } = await SetDeckImplementation.setDeckImplementation({
      deck,
      game,
      logPrefix,
      userId,
    })

    const resolvedDeck = await GameDeckResolver.fromObject({
      gameDeck,
    })
    const resolvedGame = await GameResolver.fromObject({
      game: updatedGame,
    })
    if (SetDeckMutation.logger.isTraceEnabled()) {
      SetDeckMutation.logger.trace(`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`)
    }

    EventManager.pubsub.publish(PubSubEvents.DeckSet, {
      deckSet: {
        deck: resolvedDeck,
        game: resolvedGame,
      },
    } as DeckSetPayload)

    if (updatedGame.status === GameStatus.Ordering) {
      EventManager.pubsub.publish(PubSubEvents.GameSet, {
        gameSet: resolvedGame,
      } as GameSetPayload)
      try {
        await SetGameTurnOrder.setGameTurnOrder({
          game: updatedGame,
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
