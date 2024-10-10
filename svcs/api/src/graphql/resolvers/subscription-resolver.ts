import { getLogger } from 'log4js'
import { withFilter } from 'graphql-subscriptions'

import { Deck, Game, SubscriptionResolvers } from '@gwent/graphql-schema/resolver-typings'
import EventManager from './event-manager'
import { PubSubEvents } from '@gwent/constants'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'

export default class SubscriptionResolver {
  private static logger = getLogger('SubscriptionResolver')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getResolvers(): SubscriptionResolvers<any, any> {
    return {
      deckAdded: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterator([PubSubEvents.DeckAdded]),
          async (payload, args, ctx) => SubscriptionResolver.filterDeckAdded(payload, ctx)
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
    }
  }

  private static filterDeckAdded(payload: { deckAdded: Deck }, ctx: SubscriptionContext): boolean {
    if (SubscriptionResolver.logger.isTraceEnabled()) {
      SubscriptionResolver.logger.trace(`deckAdded payload: "${JSON.stringify(payload)}"`)
      SubscriptionResolver.logger.trace(`deckAdded ctx: "${JSON.stringify(ctx)}"`)
    }
    const userId = ctx.user?._id.toString()
    const deckId = payload.deckAdded.id
    if (userId) {
      if (userId === payload.deckAdded.user.id) {
        SubscriptionResolver.logger.debug(`Publishing deckAdded for deck "${deckId}" to user "${userId}".`)
        return true
      } else {
        SubscriptionResolver.logger.debug(
          `Not publishing deckAdded for deck "${deckId}": User "${userId}" is not the deck owner "${payload.deckAdded.user.id}".`
        )
      }
    } else {
      SubscriptionResolver.logger.debug(`Not publishing deckAdded for deck "${deckId}": No user on context.`)
    }
    return false
  }

  private static filterGameAdded(payload: { gameAdded: Game }, ctx: SubscriptionContext): boolean {
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

  private static filterGameReady(payload: { gameReady: Game }, ctx: SubscriptionContext): boolean {
    if (SubscriptionResolver.logger.isTraceEnabled()) {
      SubscriptionResolver.logger.trace(`gameReady payload: "${JSON.stringify(payload)}"`)
      SubscriptionResolver.logger.trace(`gameReady ctx: "${JSON.stringify(ctx)}"`)
    }
    const userId = ctx.user?._id.toString()
    const gameId = payload.gameReady.id
    if (userId) {
      if (payload.gameReady.players.some((player) => player.user.id === userId)) {
        const notReadyPlayers = payload.gameReady.players.filter((player) => !player.ready)
        if (notReadyPlayers.length === 0) {
          SubscriptionResolver.logger.debug(`Publishing gameReady for game "${gameId}" to user "${userId}".`)
          return true
        } else {
          SubscriptionResolver.logger.debug(
            `Not publishing gameReady for game "${gameId}": Player "${JSON.stringify(
              notReadyPlayers.map((player) => player.user.id)
            )}" are still not ready.`
          )
        }
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
}

interface SubscriptionContext {
  user?: UserDbObject
}
