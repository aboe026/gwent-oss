import { allow, and, chain, rule, shield } from 'graphql-shield'
import { getLogger } from 'log4js'
import { GraphQLResolveInfo } from 'graphql'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import DeckStore from '../database/stores/deck-store'
import GameStore from '../database/stores/game-store'
import { NOT_AUTHENTICATED_MESSAGE, NOT_AUTHORIZED_MESSAGE } from '@gwent/constants'
import PresentableError from '../util/presentable-error'

export const NO_RULE_DEFINED = 'No rule defined.'

/**
 * A class to define the permissions required for performing GraphQL operations (Mutations/Queries).
 */
export default class Permissions {
  private static logger = getLogger('Permissions')

  /**
   * Returns error if rule is not defined for Query/Mutation. Prevents a Query/Mutation without an explicit rule.
   *
   * @param parent The parent of the request being made.
   * @param args The arguments supplied to the user for the request being made.
   * @param ctx The context for the request being made.
   * @param info Information about the request being made.
   * @returns true if a rule has been defined for the Query/Mutation, otherwise return an Error.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static fallback(parent: any, args: any, ctx: any, info: GraphQLResolveInfo) {
    if (info.parentType.name === 'Query') {
      Permissions.logger.error(`fallback hit because no rule defined for Query "${info.fieldName}"`)
      return Error(NO_RULE_DEFINED)
    } else if (info.parentType.name === 'Mutation') {
      Permissions.logger.error(`fallback hit because no rule defined for Mutation "${info.fieldName}"`)
      return Error(NO_RULE_DEFINED)
    }
    return true
  }

  /**
   * Check if a user is authenticated (has logged in).
   *
   * @param parent The parent of the request being made.
   * @param args The arguments supplied to the user for the request being made.
   * @param ctx The context for the request being made.
   * @param info Information about the request being made.
   * @returns true if the user is authenticated, otherwise return an Error.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static isAuthenticated(parent: any, args: any, ctx: Context, info: GraphQLResolveInfo) {
    if (!ctx.session?.user?._id) {
      Permissions.logger.warn(
        `isAuthenticated failed operation "${info.fieldName}": No user on session: "${JSON.stringify(
          ctx.session?.user
        )}"`
      )
      return Error(NOT_AUTHENTICATED_MESSAGE)
    }
    return true
  }

  /**
   * Check if a user is apart of a Game.
   *
   * @param parent The parent of the request being made.
   * @param args The arguments supplied to the user for the request being made.
   * @param ctx The context for the request being made.
   * @param info Information about the request being made.
   * @returns true if the user is a player on the game, otherwise return an Error.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static async isPlayer(parent: any, args: any, ctx: Context, info: GraphQLResolveInfo) {
    const userId = ctx.session?.user?._id
    const gameId = args.game || args.id
    const logPrefix = `isPlayer check failed operation "${info.fieldName}":`
    if (!userId) {
      Permissions.logger.warn(
        `${logPrefix} Could not extract user ID from context: "${JSON.stringify(ctx.session?.user)}"`
      )
      return Error(NOT_AUTHORIZED_MESSAGE)
    }
    if (!ObjectId.isValid(gameId)) {
      const message = `Game ID "${gameId}" not a valid MongoDB ObjectId.`
      Permissions.logger.warn(`${logPrefix} ${message}`)
      return Error(message)
    }
    try {
      const game = await GameStore.getById({
        id: gameId,
        options: {
          projection: {
            _id: 0,
            players: 1,
          },
        },
      })
      if (!game) {
        Permissions.logger.warn(`${logPrefix} Game with ID "${gameId}" does not exist.`)
        return Error(NOT_AUTHORIZED_MESSAGE)
      } else if (!game.players.find((player) => player.user.toString() === userId.toString())) {
        Permissions.logger.warn(
          `${logPrefix} User "${userId}" not included in game "${gameId}" players: "${JSON.stringify(
            game.players.map((player) => player.user.toString())
          )}".`
        )
        return Error(NOT_AUTHORIZED_MESSAGE)
      }
    } catch (error: unknown) {
      Permissions.logger.error(`${logPrefix} Exception attempting to get game with ID "${gameId}": "${error}"`)
      return Error(NOT_AUTHORIZED_MESSAGE)
    }
    return true
  }

  /**
   * Check if a user is the creator of a Deck.
   *
   * @param parent The parent of the request being made.
   * @param args The arguments supplied to the user for the request being made.
   * @param ctx The context for the request being made.
   * @param info Information about the request being made.
   * @returns true if the user owns the deck, otherwise return an Error.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static async ownsDeck(parent: any, args: any, ctx: Context, info: GraphQLResolveInfo) {
    const userId = ctx.session?.user?._id
    const deckId = args.deck || args.id
    const logPrefix = `ownsDeck check failed operation "${info.fieldName}":`
    if (!userId) {
      Permissions.logger.warn(
        `${logPrefix} Could not extract user ID from context: "${JSON.stringify(ctx.session?.user)}"`
      )
      return Error(NOT_AUTHORIZED_MESSAGE)
    }
    if (!ObjectId.isValid(deckId)) {
      const message = `Deck ID "${deckId}" not a valid MongoDB ObjectId.`
      Permissions.logger.warn(`${logPrefix} ${message}`)
      return Error(message)
    }
    try {
      const deck = await DeckStore.getById({
        id: deckId,
        options: {
          projection: {
            _id: 0,
            user: 1,
          },
        },
      })
      if (!deck) {
        Permissions.logger.warn(`${logPrefix} Deck with ID "${deckId}" does not exist.`)
        return Error(NOT_AUTHORIZED_MESSAGE)
      }
      if (deck.user.toString() !== userId.toString()) {
        Permissions.logger.warn(`${logPrefix} Deck with ID "${deckId}" not owned by user "${userId}".`)
        return Error(NOT_AUTHORIZED_MESSAGE)
      }
    } catch (error: unknown) {
      Permissions.logger.error(`${logPrefix} Exception attempting to get deck with ID "${deckId}": "${error}"`)
      return Error(NOT_AUTHORIZED_MESSAGE)
    }
    return true
  }

  /**
   * Ensure no unwanted Errors make it back to the client. Only allow known PresentableErrors to be returned.
   *
   * @param err The uncaught error being thrown.
   * @param parent The parent of the request throwing the error.
   * @param args The arguments the user supplied to the request throwing the error.
   * @param ctx The context of the request which threw the error.
   * @param info The information related to the request which threw the error.
   * @returns Error to present to the user who made the request.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-explicit-any
  private static fallbackError(err: unknown, parent: object, args: object, ctx: any, info: GraphQLResolveInfo) {
    if (err instanceof PresentableError) {
      return Error(err.message)
    }
    Permissions.logger.error(err)
    return Error('Internal Server Error.')
  }

  /**
   * The GraphQL Shield configuration to apply to the GraphQL server to enforce permissions.
   *
   * @returns The field configuration used to enforce permissions.
   */
  static shield() {
    const fallbackRule = rule({ cache: false })(Permissions.fallback)
    const isAuthenticatedRule = rule({ cache: 'contextual' })(Permissions.isAuthenticated)
    const isPlayerRule = rule({ cache: 'contextual' })(Permissions.isPlayer)
    const ownsDeckRule = rule({ cache: 'contextual' })(Permissions.ownsDeck)

    return shield(
      {
        Mutation: {
          addDeck: isAuthenticatedRule,
          addGame: isAuthenticatedRule,
          addUser: allow,
          login: allow,
          logout: allow,
          playPass: chain(isAuthenticatedRule, isPlayerRule),
          playUnit: chain(isAuthenticatedRule, isPlayerRule),
          ready: chain(isAuthenticatedRule, isPlayerRule),
          redraw: chain(isAuthenticatedRule, isPlayerRule),
          setDeck: chain(isAuthenticatedRule, and(ownsDeckRule, isPlayerRule)),
          setOrder: chain(isAuthenticatedRule, isPlayerRule),
        },
        Query: {
          application: allow,
          currentUser: isAuthenticatedRule,
          decks: isAuthenticatedRule,
          factions: isAuthenticatedRule,
          game: chain(isAuthenticatedRule, isPlayerRule),
          gameDeck: chain(isAuthenticatedRule, isPlayerRule),
          games: isAuthenticatedRule,
          leaders: isAuthenticatedRule,
          settings: isAuthenticatedRule,
          units: isAuthenticatedRule,
        },
      },
      {
        allowExternalErrors: false,
        debug: false,
        fallbackRule,
        fallbackError: Permissions.fallbackError,
      }
    )
  }
}
