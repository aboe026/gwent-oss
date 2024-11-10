import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'
import { withFilter } from 'graphql-subscriptions'

import { Deck, DeckUnit, Game, GameDeck, SubscriptionResolvers } from '@gwent/graphql-schema/resolver-typings'
import EventManager from './event-manager'
import { PubSubEvents } from '@gwent/constants'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'

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
          () => EventManager.pubsub.asyncIterator([PubSubEvents.DeckAdded]),
          async (payload, args, ctx) => SubscriptionResolver.filterDeckAdded(payload, ctx)
        ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
      deckSet: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterator([PubSubEvents.DeckSet]),
          async (payload, args, ctx) => SubscriptionResolver.filterDeckSet(payload, ctx)
        ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
      gameAdded: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterator([PubSubEvents.GameAdded]),
          async (payload, args, ctx) => SubscriptionResolver.filterGameAdded(payload, ctx)
        ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
      gameReady: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterator([PubSubEvents.GameReady]),
          async (payload, args, ctx) => SubscriptionResolver.filterGameReady(payload, ctx)
        ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
      gameSet: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterator([PubSubEvents.GameSet]),
          async (payload, args, ctx) => SubscriptionResolver.filterGameSet(payload, ctx)
        ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
      orderSet: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterator([PubSubEvents.OrderSet]),
          async (payload, args, ctx) => SubscriptionResolver.filterOrderSet(payload, ctx)
        ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
      unitRedrawn: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterator([PubSubEvents.UnitRedrawn]),
          async (payload, args, ctx) => SubscriptionResolver.filterUnitRedrawn(payload, ctx)
        ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
  private static filterDeckAdded(payload: DeckAddedPayload, ctx: SubscriptionContext): boolean {
    if (SubscriptionResolver.logger.isTraceEnabled()) {
      SubscriptionResolver.logger.trace(`deckAdded payload: "${JSON.stringify(payload)}"`)
      SubscriptionResolver.logger.trace(`deckAdded ctx: "${JSON.stringify(ctx)}"`)
    }
    const userId = ctx.user?._id.toString()
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

  private static filterDeckSet(payload: DeckSetPayload, ctx: SubscriptionContext): boolean {
    if (SubscriptionResolver.logger.isTraceEnabled()) {
      SubscriptionResolver.logger.trace(`deckSet payload: "${JSON.stringify(payload)}"`)
      SubscriptionResolver.logger.trace(`deckSet ctx: "${JSON.stringify(ctx)}"`)
    }
    const userId = ctx.user?._id.toString()
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
   * Filter out added Games that are not relevant for the user.
   *
   * @param payload The game to potentially publish.
   * @param ctx The context of the connection contiaining user information.
   * @returns True if the game should be published for the user, false if not.
   */
  private static filterGameAdded(payload: GameAddedPayload, ctx: SubscriptionContext): boolean {
    if (SubscriptionResolver.logger.isTraceEnabled()) {
      SubscriptionResolver.logger.trace(`gameAdded payload: "${JSON.stringify(payload)}"`)
      SubscriptionResolver.logger.trace(`gameAdded ctx: "${JSON.stringify(ctx)}"`)
    }
    const userId = ctx.user?._id.toString()
    const gameId = payload.gameAdded.id
    if (userId) {
      if (payload.gameAdded.players.some((player) => player.user.id === userId)) {
        SubscriptionResolver.logger.debug(`Publishing gameAdded for game "${gameId}" to user "${userId}".`)
        return true
      } else {
        SubscriptionResolver.logger.debug(
          `Not publishing gameAdded for game "${gameId}": User "${userId}" not a player on game.`
        )
      }
    } else {
      SubscriptionResolver.logger.debug(`Not publishing gameAdded for game "${gameId}": No user on context.`)
    }
    return false
  }

  /**
   * Filter out ready Games that are not relevant for the user.
   *
   * @param payload The ready game to potentially publish.
   * @param ctx The context of the connection contiaining user information.
   * @returns True if the ready game should be published for the user, false if not.
   */
  private static filterGameReady(payload: GameReadyPayload, ctx: SubscriptionContext): boolean {
    if (SubscriptionResolver.logger.isTraceEnabled()) {
      SubscriptionResolver.logger.trace(`gameReady payload: "${JSON.stringify(payload)}"`)
      SubscriptionResolver.logger.trace(`gameReady ctx: "${JSON.stringify(ctx)}"`)
    }
    const userId = ctx.user?._id.toString()
    const gameId = payload.gameReady.id
    if (userId) {
      if (payload.gameReady.players.some((player) => player.user.id === userId)) {
        SubscriptionResolver.logger.debug(`Publishing gameReady for game "${gameId}" to user "${userId}".`)
        return true
      } else {
        SubscriptionResolver.logger.debug(
          `Not publishing gameReady for game "${gameId}": User "${userId}" not a player on game.`
        )
      }
    } else {
      SubscriptionResolver.logger.debug(`Not publishing gameReady for game "${gameId}": No user on context.`)
    }
    return false
  }

  private static filterGameSet(payload: GameSetPayload, ctx: SubscriptionContext): boolean {
    if (SubscriptionResolver.logger.isTraceEnabled()) {
      SubscriptionResolver.logger.trace(`gameSet payload: "${JSON.stringify(payload)}"`)
      SubscriptionResolver.logger.trace(`gameSet ctx: "${JSON.stringify(ctx)}"`)
    }
    const userId = ctx.user?._id.toString()
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
      SubscriptionResolver.logger.debug(`Not publishing gameReady for game "${gameId}": No user on context.`)
    }
    return false
  }

  private static filterOrderSet(payload: OrderSetPayload, ctx: SubscriptionContext): boolean {
    if (SubscriptionResolver.logger.isTraceEnabled()) {
      SubscriptionResolver.logger.trace(`orderSet payload: "${JSON.stringify(payload)}"`)
      SubscriptionResolver.logger.trace(`orderSet ctx: "${JSON.stringify(ctx)}"`)
    }
    const userId = ctx.user?._id.toString()
    const gameId = payload.orderSet.id
    SubscriptionResolver.logger.debug(`orderSet userId: "${userId}", gameId: "${gameId}"`)
    if (userId) {
      if (payload.orderSet.players.some((player) => player.user.id === userId)) {
        SubscriptionResolver.logger.debug(`Publishing orderSet for game "${gameId}" to user "${userId}".`)
        return true
      } else {
        SubscriptionResolver.logger.debug(
          `Not publishing orderSet for game "${gameId}": User "${userId}" not a player on game.`
        )
      }
    } else {
      SubscriptionResolver.logger.debug(`Not publishing orderSet for game "${gameId}": No user on context.`)
    }
    return false
  }

  private static filterUnitRedrawn(payload: UnitRedrawnPayload, ctx: SubscriptionContext): boolean {
    if (SubscriptionResolver.logger.isTraceEnabled()) {
      SubscriptionResolver.logger.trace(`unitRedrawn payload: "${JSON.stringify(payload)}"`)
      SubscriptionResolver.logger.trace(`unitRedrawn ctx: "${JSON.stringify(ctx)}"`)
    }
    const userId = ctx.user?._id.toString()
    const gameId = payload.unitRedrawn.game.id
    const fromId = payload.unitRedrawn.from.unit.id
    const toId = payload.unitRedrawn.to.unit.id
    const ownerId = payload.unitRedrawn.ownerId
    SubscriptionResolver.logger.debug(
      `unitRedrawn userId: "${userId}", gameId: "${gameId}", fromId: "${fromId}", toId: "${toId}", ownerId: "${ownerId}"`
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

export interface SubscriptionContext {
  user?: UserDbObject
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

export interface UnitRedrawnPayload {
  unitRedrawn: {
    from: DeckUnit
    game: Game
    to: DeckUnit
    ownerId: ObjectId | string
  }
}
