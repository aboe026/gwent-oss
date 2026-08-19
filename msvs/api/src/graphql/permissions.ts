import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent-oss/graphql-schema/context'
import {
  DeckDbObject,
  GameDbObject,
  GamePlayerDbObject,
  UserDbObject,
} from '@gwent-oss/graphql-schema/database-typings'
import DeckStore from '../database/stores/deck-store'
import GameStore from '../database/stores/game-store'
import { NOT_AUTHENTICATED_MESSAGE, NOT_AUTHORIZED_MESSAGE } from '@gwent-oss/constants'
import PresentableError from '../util/presentable-error'

/**
 * A class to enforce permission requirements when performing GraphQL operations (Mutations/Queries).
 */
export default class Permissions {
  private static logger = getLogger('Permissions')

  /**
   * Check if a user is authenticated (has logged in).
   *
   * @param config The configuration used to verify the request is authenticated.
   * @param config.context The context for the request being made.
   * @param config.label How to identify the operation (Query/Mutation/Subscription) in the logs.
   * @returns The User database object which is on the context.
   * @throws {PresentableError} If there is no user on the context (meaning the request is unauthenticated).
   */
  static isAuthenticated({ context, label }: { context: Context; label: string }): UserDbObject {
    const user = context?.session?.user
    if (!user) {
      Permissions.logger.warn(`No user on context for ${label}: "${JSON.stringify(context?.session)}".`)
      throw new PresentableError(NOT_AUTHENTICATED_MESSAGE)
    }
    return user
  }

  /**
   * Check if a user is a Player on a Game.
   *
   * @param config The configuration used to verify the user making the request is a Player on the Game.
   * @param config.gameId The ID of the Game to verify the user is a Player on.
   * @param config.userId The ID of the User to check if they are a Player on a Game.
   * @param config.label How to identify the operation (Query/Mutation/Subscription) in the logs.
   * @returns The Game database object if a User is a Player on it.
   * @throws {PresentableError} If the User is not a Player on the Game.
   */
  static async isGamePlayer({
    gameId,
    userId,
    label,
  }: {
    gameId: string
    userId: ObjectId
    label: string
  }): Promise<GameAndPlayer> {
    const logPrefix = `isGamePlayer check failed operation "${label}":`
    let game: GameDbObject | null
    let player: GamePlayerDbObject | undefined

    if (!ObjectId.isValid(gameId)) {
      const message = `Game ID "${gameId}" not a valid MongoDB ObjectId.`
      Permissions.logger.warn(`${logPrefix} ${message}`)
      throw new PresentableError(message)
    }

    try {
      game = await GameStore.getById({
        id: gameId,
      })
      if (!game) {
        Permissions.logger.warn(`${logPrefix} Game with ID "${gameId}" does not exist.`)
        throw new PresentableError(NOT_AUTHORIZED_MESSAGE)
      } else {
        player = game.players.find((player) => player.user.toString() === userId.toString())
        if (!player) {
          Permissions.logger.warn(
            `${logPrefix} User "${userId}" not included in game "${gameId}" players: "${JSON.stringify(
              game.players.map((player) => player.user.toString())
            )}".`
          )
          throw new PresentableError(NOT_AUTHORIZED_MESSAGE)
        }
      }
    } catch (error: unknown) {
      if (error instanceof PresentableError) {
        throw error
      } else {
        Permissions.logger.error(`${logPrefix} Exception attempting to get Game with ID "${gameId}": "${error}"`)
        throw new PresentableError(NOT_AUTHORIZED_MESSAGE)
      }
    }

    return {
      game,
      player,
    }
  }

  /**
   * Check if a user is the owner of a Deck.
   *
   * @param config The configuration used to verify the User making the request is the owner on the Deck.
   * @param config.deckId The ID of the Deck to verify the User owns.
   * @param config.userId The ID of the User to check if they are the owner of the Deck.
   * @param config.label How to identify the operation (Query/Mutation/Subscription) in the logs.
   * @returns The Deck database object if a User owns it.
   * @throws {PresentableError} If the User is not the owner of the Deck.
   */
  static async isDeckOwner({
    deckId,
    userId,
    label,
  }: {
    deckId: string
    userId: ObjectId
    label: string
  }): Promise<DeckDbObject> {
    const logPrefix = `isDeckOwner check failed operation "${label}":`
    let deck: DeckDbObject | null

    if (!ObjectId.isValid(deckId)) {
      const message = `Deck ID "${deckId}" not a valid MongoDB ObjectId.`
      Permissions.logger.warn(`${logPrefix} ${message}`)
      throw new PresentableError(message)
    }

    try {
      deck = await DeckStore.getById({
        id: deckId,
      })
      if (!deck) {
        Permissions.logger.warn(`${logPrefix} Deck with ID "${deckId}" does not exist.`)
        throw new PresentableError(NOT_AUTHORIZED_MESSAGE)
      }
      if (deck.user.toString() !== userId.toString()) {
        Permissions.logger.warn(`${logPrefix} Deck with ID "${deckId}" not owned by user "${userId}".`)
        throw new PresentableError(NOT_AUTHORIZED_MESSAGE)
      }
    } catch (error: unknown) {
      if (error instanceof PresentableError) {
        throw error
      } else {
        Permissions.logger.error(`${logPrefix} Exception attempting to get Deck with ID "${deckId}": "${error}"`)
        throw new PresentableError(NOT_AUTHORIZED_MESSAGE)
      }
    }

    return deck
  }
}

export interface GameAndPlayer {
  game: GameDbObject
  player: GamePlayerDbObject
}
