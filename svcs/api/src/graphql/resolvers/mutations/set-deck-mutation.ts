import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { DeckSetPayload, GameSetPayload } from '../subscription-resolver'
import DeckStore from '../../../database/stores/deck-store'
import EventManager from '../../event-manager'
import { GameDeck, MutationSetDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import GameDeckResolver from '../types/game-deck-resolver'
import GameResolver from '../types/game-resolver'
import { FactionKey, GameStatus } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../../database/stores/game-store'
import { GraphQLResolveInfo } from 'graphql'
import PresentableError from '../../../util/presentable-error'
import { PubSubEvents } from '@gwent/constants'
import ResolverUtil from '../resolver-util'
import SetGameTurnOrder from './util/set-game-turn-order'
import SetGameDeck from './util/set-game-deck'

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
  static async setDeck(args: MutationSetDeckArgs, context: Context, info: GraphQLResolveInfo): Promise<GameDeck> {
    const resolverUtil = new ResolverUtil({
      logger: SetDeckMutation.logger,
    })
    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'setDeck mutation',
    })
    const gameId = args.game
    const deckId = args.deck

    const logPrefix = `setDeck by "${userId}" for deck "${deckId}" on game "${gameId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    resolverUtil.verifyMongoIds({
      ids: [deckId],
      label: 'Deck ID',
    })

    const deck = await DeckStore.getById({
      id: deckId,
    })
    if (SetDeckMutation.logger.isTraceEnabled()) {
      SetDeckMutation.logger.trace(`${logPrefix} deck: "${JSON.stringify(deck)}"`)
    }
    if (!deck) {
      const message = 'Deck does not exist.'
      SetDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    const { game, player } = await resolverUtil.getGamePlayer({
      gameId,
      userId,
      status: GameStatus.Decking,
      label: 'set deck',
    })

    if (player.deck.from !== null && player.deck.from !== undefined) {
      const message = 'Deck already set.'
      SetDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    SetGameDeck.setGameDeck({
      game,
      deck,
      userId,
      logPrefix,
    })

    const updatedGame = await GameStore.save(game)

    if (SetDeckMutation.logger.isTraceEnabled()) {
      SetDeckMutation.logger.trace(`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`)
    }
    if (!updatedGame) {
      const message = 'Could not set deck in probable race condition collision.'
      SetDeckMutation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    const updatedPlayer = updatedGame.players.find((gamePlayer) => gamePlayer.user.toString() === userId.toString())
    if (SetDeckMutation.logger.isTraceEnabled()) {
      SetDeckMutation.logger.trace(`${logPrefix} updatedPlayer: "${JSON.stringify(updatedPlayer)}"`)
    }
    if (!updatedPlayer) {
      const message = 'Could not get player after setting deck.'
      SetDeckMutation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    const resolvedDeck = await GameDeckResolver.fromObject({
      gameDeck: updatedPlayer.deck,
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
          player: updatedPlayer,
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
