import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'
import { withFilter } from 'graphql-subscriptions'

import { Context } from '@gwent/graphql-schema/context'
import { Deck, DeckUnit, Game, GameDeck, SubscriptionResolvers } from '@gwent/graphql-schema/resolver-typings'
import EventManager from '../event-manager'
import { PubSubEvents } from '@gwent/constants'

/**
 * A class for publising the events of the GraphQL Subscriptions defined in the schema.
 */
export default class SubscriptionResolver {
  private static logger = getLogger('SubscriptionResolver')

  /**
   * Get the methods correlating to the GraphQL Subscriptions defined in the schema.
   *
   * @returns The methods used to resolve Subscriptions defined in the GraphQL schema.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getResolvers(): SubscriptionResolvers<any, any> {
    return {
      deckAdded: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterableIterator([PubSubEvents.DeckAdded]),
          async (payload, args, ctx) => SubscriptionResolver.filterDeckAdded(payload, ctx)
        ),
      },
      deckSet: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterableIterator([PubSubEvents.DeckSet]),
          async (payload, args, ctx) => SubscriptionResolver.filterDeckSet(payload, ctx)
        ),
      },
      gameAdded: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterableIterator([PubSubEvents.GameAdded]),
          async (payload, args, ctx) =>
            SubscriptionResolver.filterPlayerOnGame({
              ctx,
              payload,
              subscriptionName: 'gameAdded',
            })
        ),
      },
      gameReady: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterableIterator([PubSubEvents.GameReady]),
          async (payload, args, ctx) =>
            SubscriptionResolver.filterPlayerOnGame({
              ctx,
              payload,
              subscriptionName: 'gameReady',
            })
        ),
      },
      gameSet: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterableIterator([PubSubEvents.GameSet]),
          async (payload, args, ctx) => SubscriptionResolver.filterGameSet(payload, ctx)
        ),
      },
      orderSet: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterableIterator([PubSubEvents.OrderSet]),
          async (payload, args, ctx) =>
            SubscriptionResolver.filterPlayerOnGame({
              ctx,
              payload,
              subscriptionName: 'orderSet',
            })
        ),
      },
      unitPlayedForGame: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterableIterator([PubSubEvents.UnitPlayedForGame]),
          async (payload, args, ctx) =>
            SubscriptionResolver.filterPlayerOnGame({
              ctx,
              payload,
              subscriptionName: 'unitPlayedForGame',
            })
        ),
      },
      unitRedrawn: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterableIterator([PubSubEvents.UnitRedrawn]),
          async (payload, args, ctx) => SubscriptionResolver.filterUnitRedrawn(payload, ctx)
        ),
      },
    }
  }

  /**
   * Filter out added Decks that are not relevant for the user.
   *
   * @param payload The deck to potentially publish.
   * @param ctx The context of the connection contiaining user information.
   * @returns True if the deck should be published for the user, false if not.
   */
  private static filterDeckAdded(payload: DeckAddedPayload, ctx: Context): boolean {
    if (SubscriptionResolver.logger.isTraceEnabled()) {
      SubscriptionResolver.logger.trace(`deckAdded payload: "${JSON.stringify(payload)}"`)
      SubscriptionResolver.logger.trace(`deckAdded ctx: "${JSON.stringify(ctx)}"`)
    }
    const userId = ctx.session?.user?._id.toString()
    const deckId = payload.deckAdded.id
    const deckOwner = payload.deckAdded.user.id
    if (userId) {
      if (userId === deckOwner) {
        SubscriptionResolver.logger.debug(`Publishing deckAdded for deck "${deckId}" to user "${userId}".`)
        return true
      } else {
        SubscriptionResolver.logger.debug(
          `Not publishing deckAdded for deck "${deckId}": User "${userId}" is not the deck owner "${deckOwner}".`
        )
      }
    } else {
      SubscriptionResolver.logger.debug(`Not publishing deckAdded for deck "${deckId}": No user on context.`)
    }
    return false
  }

  /**
   * Filter out set Decks that are not relevant for the user.
   *
   * @param payload The deck to potentially publish for the game.
   * @param ctx The context of the connection contiaining user information.
   * @returns True if the deck should be published for the user, false if not.
   */
  private static filterDeckSet(payload: DeckSetPayload, ctx: Context): boolean {
    if (SubscriptionResolver.logger.isTraceEnabled()) {
      SubscriptionResolver.logger.trace(`deckSet payload: "${JSON.stringify(payload)}"`)
      SubscriptionResolver.logger.trace(`deckSet ctx: "${JSON.stringify(ctx)}"`)
    }
    const userId = ctx.session?.user?._id.toString()
    const gameId = payload.deckSet.game.id
    const deckId = payload.deckSet.deck.from?.id
    const deckOwner = payload.deckSet.deck.from?.user.id
    if (userId) {
      if (payload.deckSet.game.players.some((player) => player.user.id === userId)) {
        if (userId === deckOwner) {
          SubscriptionResolver.logger.debug(
            `Publishing deckSet for deck "${deckId}" on game "${gameId}" to user "${userId}".`
          )
          return true
        } else {
          SubscriptionResolver.logger.debug(
            `Not publishing deckSet for deck "${deckId}" on game "${gameId}": User "${userId}" is not the deck owner "${deckOwner}".`
          )
        }
      } else {
        SubscriptionResolver.logger.debug(
          `Not publishing deckSet for deck "${deckId}" on game "${gameId}": User "${userId}" not a player on game.`
        )
      }
    } else {
      SubscriptionResolver.logger.debug(
        `Not publishing deckSet for deck "${deckId}" on game "${gameId}": No user on context.`
      )
    }
    return false
  }

  /**
   * Filter out set Games that are not relevant for the user.
   *
   * @param payload The set game to potentially publish.
   * @param ctx The context of the connection contiaining user information.
   * @returns True if the set game should be published for the user, false if not.
   */
  private static filterGameSet(payload: GameSetPayload, ctx: Context): boolean {
    if (SubscriptionResolver.logger.isTraceEnabled()) {
      SubscriptionResolver.logger.trace(`gameSet payload: "${JSON.stringify(payload)}"`)
      SubscriptionResolver.logger.trace(`gameSet ctx: "${JSON.stringify(ctx)}"`)
    }
    const userId = ctx.session?.user?._id.toString()
    const gameId = payload.gameSet.id
    if (userId) {
      if (payload.gameSet.players.some((player) => player.user.id === userId)) {
        const notReadyPlayers = payload.gameSet.players.filter((player) => !player.faction)
        if (notReadyPlayers.length === 0) {
          SubscriptionResolver.logger.debug(`Publishing gameSet for game "${gameId}" to user "${userId}".`)
          return true
        } else {
          SubscriptionResolver.logger.debug(
            `Not publishing gameSet for game "${gameId}": Player(s) "${JSON.stringify(
              notReadyPlayers.map((player) => player.user.id)
            )}" not set.`
          )
        }
      } else {
        SubscriptionResolver.logger.debug(
          `Not publishing gameSet for game "${gameId}": User "${userId}" not a player on game.`
        )
      }
    } else {
      SubscriptionResolver.logger.debug(`Not publishing gameSet for game "${gameId}": No user on context.`)
    }
    return false
  }

  private static filterPlayerOnGame({
    payload,
    ctx,
    subscriptionName,
  }: {
    payload: any // eslint-disable-line @typescript-eslint/no-explicit-any
    ctx: Context
    subscriptionName: string
  }): boolean {
    if (SubscriptionResolver.logger.isTraceEnabled()) {
      SubscriptionResolver.logger.trace(`${subscriptionName} payload: "${JSON.stringify(payload)}"`)
      SubscriptionResolver.logger.trace(`${subscriptionName} ctx: "${JSON.stringify(ctx)}"`)
    }
    const userId = ctx.session?.user?._id.toString()
    const game: Game = payload[subscriptionName]
    const gameId = game.id
    SubscriptionResolver.logger.debug(`${subscriptionName} with userId: "${userId}", gameId: "${gameId}"`)
    if (userId) {
      if (game.players.some((player) => player.user.id === userId)) {
        SubscriptionResolver.logger.debug(`Publishing ${subscriptionName} for game "${gameId}" to user "${userId}".`)
        return true
      } else {
        SubscriptionResolver.logger.debug(
          `Not publishing ${subscriptionName} for game "${gameId}": User "${userId}" not a player on game.`
        )
      }
    } else {
      SubscriptionResolver.logger.debug(`Not publishing ${subscriptionName} for game "${gameId}": No user on context.`)
    }
    return false
  }

  /**
   * Filter out redrawn units that are not relevant for the user.
   *
   * @param payload The redrawn units to potentially publish.
   * @param ctx The context of the connection contiaining user information.
   * @returns True if the redrawn unit should be published for the user, false if not.
   */
  private static filterUnitRedrawn(payload: UnitRedrawnPayload, ctx: Context): boolean {
    if (SubscriptionResolver.logger.isTraceEnabled()) {
      SubscriptionResolver.logger.trace(`unitRedrawn payload: "${JSON.stringify(payload)}"`)
      SubscriptionResolver.logger.trace(`unitRedrawn ctx: "${JSON.stringify(ctx)}"`)
    }
    const userId = ctx.session?.user?._id.toString()
    const gameId = payload.unitRedrawn.game.id
    const fromId = payload.unitRedrawn.from.unit.id
    const toId = payload.unitRedrawn.to.unit.id
    const ownerId = payload.unitRedrawn.ownerId
    SubscriptionResolver.logger.debug(
      `unitRedrawn with userId: "${userId}", gameId: "${gameId}", fromId: "${fromId}", toId: "${toId}", ownerId: "${ownerId}"`
    )
    if (userId) {
      if (payload.unitRedrawn.game.players.some((player) => player.user.id === userId)) {
        if (userId === ownerId.toString()) {
          SubscriptionResolver.logger.debug(
            `Publishing unitRedrawn for unit "${fromId}" on game "${gameId}" to user "${userId}".`
          )
          return true
        } else {
          SubscriptionResolver.logger.debug(
            `Not publishing unitRedrawn for unit "${fromId}" on game "${gameId}": User "${userId}" is not deck owner "${ownerId}".`
          )
        }
      } else {
        SubscriptionResolver.logger.debug(
          `Not publishing unitRedrawn for unit "${fromId}" on game "${gameId}": User "${userId}" not a player on game.`
        )
      }
    } else {
      SubscriptionResolver.logger.debug(
        `Not publishing unitRedrawn for unit "${fromId}" on game "${gameId}": No user on context.`
      )
    }
    return false
  }
}

export interface DeckAddedPayload {
  deckAdded: Deck
}

export interface DeckSetPayload {
  deckSet: {
    deck: GameDeck
    game: Game
  }
}

export interface GameAddedPayload {
  gameAdded: Game
}

export interface GameReadyPayload {
  gameReady: Game
}

export interface GameSetPayload {
  gameSet: Game
}

export interface OrderSetPayload {
  orderSet: Game
}

export interface UnitPlayedForGamePayload {
  unitPlayedForGame: Game
}

export interface UnitRedrawnPayload {
  unitRedrawn: {
    from: DeckUnit
    game: Game
    to: DeckUnit
    ownerId: ObjectId | string
  }
}
