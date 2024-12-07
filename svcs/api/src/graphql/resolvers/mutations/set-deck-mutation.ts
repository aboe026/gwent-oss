import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import DeckStore from '../../../database/stores/deck-store'
import EventManager from '../../event-manager'
import { GameDeck, MutationSetDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import GameDeckResolver from '../types/game-deck-resolver'
import GameResolver from '../types/game-resolver'
import GameStore from '../../../database/stores/game-store'
import { getRandomSubset } from '@gwent/utils'
import { GraphQLResolveInfo } from 'graphql'
import MutationUtil from './mutation-util'
import { NOT_AUTHENTICATED_MESSAGE, PubSubEvents, STARTING_HAND_SIZE } from '@gwent/constants'
import { RequestedFields } from '@gwent/graphql-schema'

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
    const userId = context.session?.user?._id
    if (!userId) {
      SetDeckMutation.logger.error(`No user on context for setDeck mutation: "${JSON.stringify(context.session)}".`)
      return Error(NOT_AUTHENTICATED_MESSAGE) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const logPrefix = `setDeck by "${userId}"`
    if (SetDeckMutation.logger.isTraceEnabled()) {
      SetDeckMutation.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
      SetDeckMutation.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      SetDeckMutation.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }
    const gameId = args.game
    const deckId = args.deck

    const deck = await DeckStore.getById({
      id: deckId,
    })
    if (SetDeckMutation.logger.isTraceEnabled()) {
      SetDeckMutation.logger.trace(`${logPrefix} deck: "${JSON.stringify(deck)}"`)
    }
    if (!deck) {
      const message = `Deck with ID "${deckId}" does not exist.`
      SetDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const game = await GameStore.getById({
      id: gameId,
    })
    if (SetDeckMutation.logger.isTraceEnabled()) {
      SetDeckMutation.logger.trace(`${logPrefix} game: "${JSON.stringify(game)}"`)
    }
    if (!game) {
      const message = `Game with ID "${gameId}" does not exist.`
      SetDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const player = game.players.find((player) => player.user.toString() === userId.toString())
    if (SetDeckMutation.logger.isTraceEnabled()) {
      SetDeckMutation.logger.trace(`${logPrefix} player: "${JSON.stringify(player)}"`)
    }
    if (!player) {
      const message = `Not a player on game "${gameId}".`
      SetDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (player.deck.from !== null && player.deck.from !== undefined) {
      const message = `Deck already set for game "${gameId}".`
      SetDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

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
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const updatedPlayer = updatedGame.players.find((gamePlayer) => gamePlayer.user.toString() === userId.toString())
    if (SetDeckMutation.logger.isTraceEnabled()) {
      SetDeckMutation.logger.trace(`${logPrefix} updatedPlayer: "${JSON.stringify(updatedPlayer)}"`)
    }
    if (!updatedPlayer) {
      const message = `Could not get player after setting deck "${deckId}" on game "${gameId}".`
      SetDeckMutation.logger.error(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const resolvedDeck = await GameDeckResolver.fromObject({
      gameDeck: updatedPlayer.deck,
      neutralDeckStats: RequestedFields.getArgument(info, 'setDeck.from.faction.stats.neutrals'),
      neutralLeaderStats: RequestedFields.getArgument(info, 'setDeck.from.leader.faction.stats.neutrals'),
      neutralUnitStats: RequestedFields.getArgument(info, 'setDeck.from.units.unit.faction.stats.neutrals'),
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
    })

    if (!updatedGame.players.find((player) => !player.deck.from)) {
      // all players have chosen decks, notify clients
      EventManager.pubsub.publish(PubSubEvents.GameSet, {
        gameSet: resolvedGame,
      })
      await MutationUtil.setGameTurnOrder({
        userId,
        gameId,
        logPrefix: `setOrder via ${logPrefix}`,
        allowImplicit: false,
      })
    }

    return resolvedDeck
  }
}
