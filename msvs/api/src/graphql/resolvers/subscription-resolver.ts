import { getLogger } from 'log4js'
import { withFilter } from 'graphql-subscriptions'

import { Context } from '@gwent/graphql-schema/context'
import { Deck, DeckUnit, Game, GameDeck, SubscriptionResolvers } from '@gwent/graphql-schema/resolver-typings'
import EventManager from '../event-manager'
import GameResolver from './types/game-resolver'
import { getNestedProperty, setNestedProperty } from '@gwent/utils'
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
          async (payload, args, ctx) =>
            SubscriptionResolver.filterDeckOwner({
              ctx,
              payload,
              subscriptionName: 'deckAdded',
            })
        ),
      },
      deckSet: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterableIterator([PubSubEvents.DeckSet]),
          async (payload, args, ctx) =>
            SubscriptionResolver.filterDeckOwner({
              ctx,
              payload,
              subscriptionName: 'deckSet',
              nestedDeckPath: 'deck.from',
            }) &&
            SubscriptionResolver.filterPlayerOnGame({
              ctx,
              payload,
              subscriptionName: 'deckSet',
              nestedGamePath: 'game',
            })
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
          async (payload, args, ctx) =>
            SubscriptionResolver.filterPlayerOnGame({
              ctx,
              payload,
              subscriptionName: 'gameSet',
            })
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
      passPlayed: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterableIterator([PubSubEvents.PassPlayed]),
          async (payload, args, ctx) =>
            SubscriptionResolver.filterPlayerOnGame({
              ctx,
              payload,
              subscriptionName: 'passPlayed',
            })
        ),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        resolve: (payload: UnitPlayedOnGamePayload, args: any, ctx: Context, info: any) => {
          return SubscriptionResolver.hideImpactUnits({
            ctx,
            payload,
            subscriptionName: 'passPlayed',
          })
        },
      },
      roundEndedForDeck: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterableIterator([PubSubEvents.RoundEndedForDeck]),
          async (payload, args, ctx) =>
            SubscriptionResolver.filterDeckOwner({
              ctx,
              payload,
              subscriptionName: 'roundEndedForDeck',
              nestedDeckPath: 'deck.from',
            }) &&
            SubscriptionResolver.filterPlayerOnGame({
              ctx,
              payload,
              subscriptionName: 'roundEndedForDeck',
              nestedGamePath: 'game',
            })
        ),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        resolve: (payload: UnitPlayedOnGamePayload, args: any, ctx: Context, info: any) => {
          return SubscriptionResolver.hideImpactUnits({
            ctx,
            payload,
            subscriptionName: 'roundEndedForDeck',
            nestedGamePath: 'game',
          })
        },
      },
      unitPlayedFromDeck: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterableIterator([PubSubEvents.UnitPlayedFromDeck]),
          async (payload, args, ctx) =>
            SubscriptionResolver.filterDeckOwner({
              ctx,
              payload,
              subscriptionName: 'unitPlayedFromDeck',
              nestedDeckPath: 'deck.from',
            }) &&
            SubscriptionResolver.filterPlayerOnGame({
              ctx,
              payload,
              subscriptionName: 'unitPlayedFromDeck',
              nestedGamePath: 'game',
            })
        ),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        resolve: (payload: UnitPlayedOnGamePayload, args: any, ctx: Context, info: any) => {
          return SubscriptionResolver.hideImpactUnits({
            ctx,
            payload,
            subscriptionName: 'unitPlayedFromDeck',
            nestedGamePath: 'game',
          })
        },
      },
      unitPlayedOnGame: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterableIterator([PubSubEvents.UnitPlayedOnGame]),
          async (payload, args, ctx) =>
            SubscriptionResolver.filterPlayerOnGame({
              ctx,
              payload,
              subscriptionName: 'unitPlayedOnGame',
              nestedGamePath: 'game',
            })
        ),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        resolve: (payload: UnitPlayedOnGamePayload, args: any, ctx: Context, info: any) => {
          return SubscriptionResolver.hideImpactUnits({
            ctx,
            payload,
            subscriptionName: 'unitPlayedOnGame',
            nestedGamePath: 'game',
          })
        },
      },
      unitRedrawn: {
        subscribe: withFilter(
          () => EventManager.pubsub.asyncIterableIterator([PubSubEvents.UnitRedrawn]),
          async (payload, args, ctx) =>
            SubscriptionResolver.filterDeckOwner({
              ctx,
              payload,
              subscriptionName: 'unitRedrawn',
              nestedDeckPath: 'deck.from',
            }) &&
            SubscriptionResolver.filterPlayerOnGame({
              ctx,
              payload,
              subscriptionName: 'unitRedrawn',
              nestedGamePath: 'game',
            })
        ),
      },
    }
  }

  /**
   * Whether or not the user owns the deck the message is for.
   *
   * @param config The configuration to determine if the user owns the deck.
   * @param config.ctx The context for the message containing the user.
   * @param config.nestedDeckPath The optional path of the property within the payload which contains the deck.
   * @param config.payload The object containing the subscription data, including the deck.
   * @param config.subscriptionName The name of the subscription for the message.
   * @returns True if the user owns the deck, false otherwise.
   */
  private static filterDeckOwner({
    ctx,
    nestedDeckPath,
    payload,
    subscriptionName,
  }: {
    ctx: Context
    payload: any // eslint-disable-line @typescript-eslint/no-explicit-any
    nestedDeckPath?: string
    subscriptionName: string
  }): boolean {
    if (SubscriptionResolver.logger.isTraceEnabled()) {
      SubscriptionResolver.logger.trace(`${subscriptionName} filterDeckOwner payload: "${JSON.stringify(payload)}"`)
      SubscriptionResolver.logger.trace(`${subscriptionName} filterDeckOwner ctx: "${JSON.stringify(ctx)}"`)
      SubscriptionResolver.logger.trace(`${subscriptionName} filterDeckOwner subscriptionName: "${subscriptionName}"`)
      SubscriptionResolver.logger.trace(`${subscriptionName} filterDeckOwner nestedDeckPath: "${nestedDeckPath}"`)
    }
    const userId = ctx.session?.user?._id.toString()
    const nestedProperty = `${subscriptionName}${nestedDeckPath ? `.${nestedDeckPath}` : ''}`
    const deck = getNestedProperty<Deck>({
      obj: payload,
      nestedProperty,
    })
    if (!deck) {
      const message = `Could not find deck in payload for subscription "${subscriptionName}"`
      SubscriptionResolver.logger.error(
        `${message}, nestedProperty: "${nestedProperty}", payload: "${JSON.stringify(payload)}"`
      )
      throw Error(`${message}.`)
    }
    const deckId = deck.id
    const deckOwner = deck.user.id
    if (userId) {
      if (userId === deckOwner) {
        SubscriptionResolver.logger.debug(`Publishing ${subscriptionName} for deck "${deckId}" to user "${userId}".`)
        return true
      } else {
        SubscriptionResolver.logger.debug(
          `Not publishing ${subscriptionName} for deck "${deckId}": User "${userId}" is not the deck owner "${deckOwner}".`
        )
      }
    } else {
      SubscriptionResolver.logger.debug(`Not publishing ${subscriptionName} for deck "${deckId}": No user on context.`)
    }
    return false
  }

  /**
   * Whether or not the user is a player on the game the message is for.
   *
   * @param config The configuration to determine if the user is a player of the game.
   * @param config.ctx The context for the message containing the user.
   * @param config.nestedGamePath The optional path of the property within the payload which contains the game.
   * @param config.payload The object containing the subscription data, including the game.
   * @param config.subscriptionName The name of the subscription for the message.
   * @returns True if the user is a player on the game, false otherwise.
   */
  private static filterPlayerOnGame({
    payload,
    ctx,
    subscriptionName,
    nestedGamePath,
  }: {
    payload: any // eslint-disable-line @typescript-eslint/no-explicit-any
    ctx: Context
    subscriptionName: string
    nestedGamePath?: string
  }): boolean {
    if (SubscriptionResolver.logger.isTraceEnabled()) {
      SubscriptionResolver.logger.trace(`${subscriptionName} filterPlayerOnGame payload: "${JSON.stringify(payload)}"`)
      SubscriptionResolver.logger.trace(`${subscriptionName} filterPlayerOnGame ctx: "${JSON.stringify(ctx)}"`)
      SubscriptionResolver.logger.trace(
        `${subscriptionName} filterPlayerOnGame subscriptionName: "${subscriptionName}"`
      )
      SubscriptionResolver.logger.trace(`${subscriptionName} filterPlayerOnGame nestedGamePath: "${nestedGamePath}"`)
    }
    const userId = ctx.session?.user?._id.toString()
    const nestedProperty = `${subscriptionName}${nestedGamePath ? `.${nestedGamePath}` : ''}`
    const game = getNestedProperty<Game>({
      obj: payload,
      nestedProperty,
    })
    if (!game) {
      const message = `Could not find game in payload for subscription "${subscriptionName}"`
      SubscriptionResolver.logger.error(
        `${message}, nestedProperty: "${nestedProperty}", payload: "${JSON.stringify(payload)}"`
      )
      throw Error(`${message}.`)
    }
    const gameId = game.id
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
   * Hides the Units of Impacts for opponents on a subscription payload for a game.
   *
   * @param config The configuration used to hide the Impact Units for Opponents.
   * @param config.payload The payload to be returned to the Subscription.
   * @param config.ctx The context containing the User the Subscription will be returned to.
   * @param config.subscriptionName The name of the subscription being executed.
   * @param config.nestedGamePath The optional path of the property within the payload which contains the game.
   * @returns The payload for the subscription.
   */
  private static hideImpactUnits({
    payload,
    ctx,
    subscriptionName,
    nestedGamePath,
  }: {
    payload: any // eslint-disable-line @typescript-eslint/no-explicit-any
    ctx: Context
    subscriptionName: string
    nestedGamePath?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): any {
    if (SubscriptionResolver.logger.isTraceEnabled()) {
      SubscriptionResolver.logger.trace(`${subscriptionName} hideImpactUnits payload: "${JSON.stringify(payload)}"`)
      SubscriptionResolver.logger.trace(`${subscriptionName} hideImpactUnits ctx: "${JSON.stringify(ctx)}"`)
      SubscriptionResolver.logger.trace(`${subscriptionName} hideImpactUnits nestedGamePath: "${nestedGamePath}"`)
    }
    const nestedProperty = `${subscriptionName}${nestedGamePath ? `.${nestedGamePath}` : ''}`
    const userId = ctx.session?.user?._id.toString()

    if (!userId) {
      const message = `Could not find user in context for subscription "${subscriptionName}"`
      SubscriptionResolver.logger.error(
        `${message}, nestedProperty: "${nestedProperty}", payload: "${JSON.stringify(payload)}"`
      )
      throw Error(`${message}.`)
    }

    const game = getNestedProperty<Game>({
      obj: payload,
      nestedProperty,
    })
    if (!game) {
      const message = `Could not find game in payload for subscription "${subscriptionName}"`
      SubscriptionResolver.logger.error(
        `${message}, nestedProperty: "${nestedProperty}", payload: "${JSON.stringify(payload)}"`
      )
      throw Error(`${message}.`)
    }

    const maskedGame = GameResolver.maskSpiedHandUnits({
      game,
      userId,
    })

    setNestedProperty({
      obj: payload,
      path: nestedProperty,
      value: maskedGame,
    })

    return payload[subscriptionName]
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

export interface PassPlayedPayload {
  passPlayed: Game
}

export interface RoundEndedForDeckPayload {
  roundEndedForDeck: {
    deck: GameDeck
    game: Game
  }
}

export interface UnitPlayedFromDeckPayload {
  unitPlayedFromDeck: {
    deck: GameDeck
    game: Game
    handed: DeckUnit[]
    unit: DeckUnit
  }
}

export interface UnitPlayedOnGamePayload {
  unitPlayedOnGame: {
    game: Game
    unit: DeckUnit
  }
}

export interface UnitRedrawnPayload {
  unitRedrawn: {
    from: DeckUnit
    deck: GameDeck
    game: Game
    to: DeckUnit
  }
}
