import { allow, and, chain, rule, shield } from 'graphql-shield'
import log4js from 'log4js'
import { GraphQLResolveInfo } from 'graphql'
import { ObjectId } from 'mongodb'

import DeckStore from '../database/stores/deck-store.mjs'
import env from '../env.mjs'
import GameStore from '../database/stores/game-store.mjs'
import { NODE_ENV } from '@gwent/env'
import { NOT_AUTHENTICATED_MESSAGE, NOT_AUTHORIZED_MESSAGE } from '@gwent/constants'

export const NO_RULE_DEFINED = 'No rule defined.'

/**
 * A class to define the permissions required for performing GraphQL operations (Mutations/Queries).
 */
export class Permissions {
  private static logger = log4js.getLogger('permissions')

  /**
   * Throws error if rule is not defined for Query/Mutation.
   * to prevent someone for forgetting to explicitly set them.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
  static fallback(parent: any, args: any, ctx: any, info: GraphQLResolveInfo) {
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
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
  static isAuthenticated(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
    if (!context?.session?.user?._id) {
      Permissions.logger.debug(
        `isAuthenticated failed operation "${info.fieldName}": No user on session: "${JSON.stringify(
          context?.session?.user
        )}"`
      )
      return Error(NOT_AUTHENTICATED_MESSAGE)
    }
    return true
  }

  /**
   * Check if a user is apart of a Game.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
  static async isPlayer(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
    const userId = context?.session?.user?._id
    const gameId = args.game || args.id
    const logPrefix = `isPlayer check failed operation "${info.fieldName}":`
    if (!userId) {
      Permissions.logger.debug(
        `${logPrefix} Could not extract user ID from context: "${JSON.stringify(context?.session?.user)}"`
      )
      return Error(NOT_AUTHORIZED_MESSAGE)
    }
    if (!ObjectId.isValid(gameId)) {
      Permissions.logger.debug(`${logPrefix} gameId "${gameId}" not a valid ObjectId.`)
      return Error(NOT_AUTHORIZED_MESSAGE)
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
        Permissions.logger.debug(`${logPrefix} Game with ID "${gameId}" does not exist.`)
        return Error(NOT_AUTHORIZED_MESSAGE)
      } else if (!game.players.find((player) => player.user.toString() === userId.toString())) {
        Permissions.logger.debug(
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
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
  static async ownsDeck(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
    const userId = context?.session?.user?._id
    const deckId = args.deck || args.id
    const logPrefix = `ownsDeck check failed operation "${info.fieldName}":`
    if (!userId) {
      Permissions.logger.debug(
        `${logPrefix} Could not extract user ID from context: "${JSON.stringify(context?.session?.user)}"`
      )
      return Error(NOT_AUTHORIZED_MESSAGE)
    }
    if (!ObjectId.isValid(deckId)) {
      Permissions.logger.debug(`${logPrefix} deckId "${deckId}" not a valid ObjectId.`)
      return Error(NOT_AUTHORIZED_MESSAGE)
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
        Permissions.logger.debug(`${logPrefix} Deck with ID "${deckId}" does not exist.`)
        return Error(NOT_AUTHORIZED_MESSAGE)
      }
      if (deck.user.toString() !== userId.toString()) {
        Permissions.logger.debug(`${logPrefix} Deck with ID "${deckId}" not owned by user "${userId}".`)
        return Error(NOT_AUTHORIZED_MESSAGE)
      }
    } catch (error: unknown) {
      Permissions.logger.error(`${logPrefix} Exception attempting to get deck with ID "${deckId}": "${error}"`)
      return Error(NOT_AUTHORIZED_MESSAGE)
    }
    return true
  }
}

const fallbackRule = rule({ cache: false })(Permissions.fallback)
const isAuthenticatedRule = rule({ cache: 'contextual' })(Permissions.isAuthenticated)
const isPlayerRule = rule({ cache: 'contextual' })(Permissions.isPlayer)
const ownsDeckRule = rule({ cache: 'contextual' })(Permissions.ownsDeck)

export default shield(
  {
    Mutation: {
      addDeck: isAuthenticatedRule,
      addGame: isAuthenticatedRule,
      addUser: allow,
      login: allow,
      logout: allow,
      ready: chain(isAuthenticatedRule, isPlayerRule),
      redraw: chain(isAuthenticatedRule, isPlayerRule),
      setDeck: chain(isAuthenticatedRule, and(ownsDeckRule, isPlayerRule)),
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
    allowExternalErrors: env().NODE_ENV === NODE_ENV.Dev,
    debug: env().NODE_ENV === NODE_ENV.Dev,
    fallbackRule,
    fallbackError: 'Internal Server Error.',
  }
)
