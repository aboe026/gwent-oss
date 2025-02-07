import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { DeckSetPayload, GameSetPayload } from '../subscription-resolver'
import DeckStore from '../../../database/stores/deck-store'
import EventManager from '../../event-manager'
import { GameDeck, MutationSetDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import GameDeckResolver from '../types/game-deck-resolver'
import GameResolver from '../types/game-resolver'
import { GameStatus } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../../database/stores/game-store'
import { getRandomSubset } from '@gwent/utils'
import { GraphQLResolveInfo } from 'graphql'
import MutationUtil from './mutation-util'
import PresentableError from '../../../util/presentable-error'
import { PubSubEvents, STARTING_HAND_SIZE } from '@gwent/constants'
import ResolverUtil from '../resolver-util'

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
   */
  static async setDeck(args: MutationSetDeckArgs, context: Context, info: GraphQLResolveInfo): Promise<GameDeck> {
    const resolverUtil = new ResolverUtil({
      logger: SetDeckMutation.logger,
    })
    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'setDeck mutation',
    })

    const logPrefix = `setDeck by "${userId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.printArgsAndInfo({
      args,
      info,
    })

    const gameId = args.game
    const deckId = args.deck

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
      const message = `Deck with ID "${deckId}" does not exist.`
      SetDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    const { player } = await resolverUtil.getGamePlayer({
      gameId,
      userId,
      status: GameStatus.Decking,
      label: 'set deck',
    })

    if (player.deck.from !== null && player.deck.from !== undefined) {
      const message = `Deck already set for game "${gameId}".`
      SetDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    const mutationUtil = new MutationUtil({
      logger: SetDeckMutation.logger,
      logPrefix,
    })

    const hand = getRandomSubset({
      items: deck.units,
      size: STARTING_HAND_SIZE,
    })
    if (SetDeckMutation.logger.isTraceEnabled()) {
      SetDeckMutation.logger.trace(`${logPrefix} hand: "${JSON.stringify(hand)}"`)
    }
    const handIds = hand.map((deckUnit) => deckUnit.unit.toString())
    const undrawn = deck.units.filter((deckUnit) => !handIds.includes(deckUnit.unit.toString()))
    if (SetDeckMutation.logger.isTraceEnabled()) {
      SetDeckMutation.logger.trace(`${logPrefix} undrawn: "${JSON.stringify(undrawn)}"`)
    }

    const updatedGame = await GameStore.setDeck({
      deck,
      gameId,
      hand,
      undrawn,
      userId,
    })

    if (SetDeckMutation.logger.isTraceEnabled()) {
      SetDeckMutation.logger.trace(`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`)
    }
    if (!updatedGame) {
      const message = `Could not set deck "${deckId}" on game "${gameId}" in probable race condition collision.`
      SetDeckMutation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    const updatedPlayer = updatedGame.players.find((gamePlayer) => gamePlayer.user.toString() === userId.toString())
    if (SetDeckMutation.logger.isTraceEnabled()) {
      SetDeckMutation.logger.trace(`${logPrefix} updatedPlayer: "${JSON.stringify(updatedPlayer)}"`)
    }
    if (!updatedPlayer) {
      const message = `Could not get player after setting deck "${deckId}" on game "${gameId}".`
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

    if (!updatedGame.players.find((player) => !player.deck.from)) {
      // all players have chosen decks, notify clients
      EventManager.pubsub.publish(PubSubEvents.GameSet, {
        gameSet: resolvedGame,
      } as GameSetPayload)
      await mutationUtil.setGameTurnOrder({
        userId,
        gameId,
        logPrefix: `setOrder via ${logPrefix}`,
        allowImplicit: false,
      })
    }

    return resolvedDeck
  }
}
