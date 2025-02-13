import { Logger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { GameDbObject, GamePlayerDbObject, GameStatus, UserDbObject } from '@gwent/graphql-schema/database-typings'
import GameResolver from './types/game-resolver'
import GameStore from '../../database/stores/game-store'
import { GraphQLResolveInfo } from 'graphql'
import { NOT_AUTHENTICATED_MESSAGE, REDACTED } from '@gwent/constants'
import PresentableError from '../../util/presentable-error'
import { RequestedFields } from '@gwent/graphql-schema'

/**
 * A class for common utilities used across resolvers.
 */
export default class ResolverUtil {
  private logger: Logger
  private logPrefix: string

  /**
   * Instantiate a ResolverUtil object.
   *
   * @param config The configuration to instantiate the ResolverUtil with.
   * @param config.logger The logger to use in subsequent ResolverUtil method calls.
   * @param config.logPrefix The prefix to prepend to log statements.
   */
  constructor({ logger, logPrefix = '' }: { logger: Logger; logPrefix?: string }) {
    this.logger = logger
    this.logPrefix = logPrefix
  }

  /**
   * Sets the logPrefix that gets appended to log statements on subsequent ResolverUtil method calls.
   *
   * @param logPrefix The prefix to prepend to log statements.
   */
  setLogPrefix(logPrefix: string) {
    this.logPrefix = logPrefix
  }

  /**
   * Gets the current user on the context if one exists, throws Error otherwise.
   *
   * @param config The configuration to get the context user.
   * @param config.context The Context potentially containing the user.
   * @param config.label The label to use on log calls to more easily know where the call was made.
   * @returns The user on the context if they exist.
   * @throws PresentableError if there is no user on the context.
   */
  getContextUser({ context, label }: { context: Context; label: string }): UserDbObject {
    const user = context.session?.user
    if (!user) {
      this.logger.error(`No user on context for ${label}: "${JSON.stringify(context.session)}".`)
      throw new PresentableError(NOT_AUTHENTICATED_MESSAGE)
    }
    return user
  }

  /**
   * Ensures given IDs are valid MongoDB ObjectIds.
   *
   * @param config The configuration to verify the ObjectIds.
   * @param config.ids The IDs to verify.
   * @param config.label The label to use on log calls to more easily know where the call was made.
   * @throws PresentableError if there are any invalid MongoDB ObjectIds.
   */
  verifyMongoIds({ ids, label }: { ids: string[]; label: string }) {
    for (const id of ids) {
      if (!ObjectId.isValid(id)) {
        const message = `${label} "${id}" is not a valid MongoDB ObjectId.`
        this.logger.warn(`${this.logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
    }
  }

  /**
   * Outputs to the logger the information about a GraphQL request.
   *
   * @param config The configuraiton used to print the GraphQL request information.
   * @param config.args The potential arguments on the given GraphQL request.
   * @param config.info The information on the GraphQL request.
   * @param secureKeys Any keys on the args that contain sensitive information and whose value should be redacted.
   */
  logRequestInfo({
    args,
    info,
    secureKeys = [],
  }: {
    args?: any // eslint-disable-line @typescript-eslint/no-explicit-any
    info: GraphQLResolveInfo
    secureKeys?: string[]
  }) {
    if (this.logger.isTraceEnabled()) {
      const secureArgs = {
        ...args,
      }
      for (const secureKey of secureKeys) {
        secureArgs[secureKey] = REDACTED
      }
      this.logger.trace(`${this.logPrefix} args: "${JSON.stringify(secureArgs)}"`)
      this.logger.trace(
        `${this.logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      this.logger.trace(
        `${this.logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }
  }

  /**
   * Get a game and player on it.
   *
   * @param config The configuration to get the Game and the player on it.
   * @param config.gameId The ID of the game to get.
   * @param config.userId The ID of the player to get on the game.
   * @param config.logPrefix The prefix to add to the beginning of log statements.
   * @param config.status An optional status to require the game to have, otherwise return an error.
   * @param config.turn Whether or not to enforce that the given game player should be the player with the current turn, otherwise return an error.
   * @param config.label The label to use when logging and returning errors.
   * @returns The game and player if they exist.
   * @throws PresentableError if there is a problem getting the game or player.
   */
  async getGamePlayer({
    gameId,
    userId,
    status,
    turn,
    label,
  }: {
    gameId: string
    userId: ObjectId
    status?: GameStatus
    turn?: boolean
    label?: string
  }): Promise<GamePlayerResponse> {
    this.verifyMongoIds({
      ids: [gameId],
      label: 'Game ID',
    })

    const game = await GameStore.getById({
      id: gameId,
    })
    if (this.logger.isTraceEnabled()) {
      this.logger.trace(`${this.logPrefix} getGamePlayer game: "${JSON.stringify(game)}"`)
    }
    if (!game) {
      const message = `Game with ID "${gameId}" does not exist.`
      this.logger.warn(`${this.logPrefix} getGamePlayer failed: ${message}`)
      throw new PresentableError(message)
    }
    const players: GamePlayerDbObject[] = game.players.filter((player) => player.user.toString() === userId.toString())
    if (this.logger.isTraceEnabled()) {
      this.logger.trace(`${this.logPrefix} getGamePlayer game "${game._id}" players: "${JSON.stringify(players)}"`)
    }
    if (players.length === 0) {
      const message = `Not a player on game "${gameId}".`
      this.logger.warn(`${this.logPrefix} getGamePlayer failed: ${message}`)
      throw new PresentableError(message)
    }
    if (players.length > 1) {
      const message = `Found more than 1 player with ID "${userId}" on game "${gameId}"`
      this.logger.error(`${this.logPrefix} getGamePlayer failed: ${message}: "${JSON.stringify(players)}"`)
      throw Error(`${message}.`)
    }

    if (status) {
      if (game.status !== status) {
        const message = `Invalid game status "${game.status}": Can only ${label} for game with status "${status}".`
        this.logger.warn(`${this.logPrefix} getGamePlayer failed: ${message}`)
        throw new PresentableError(message)
      }
    }

    if (turn) {
      if (game.turn?.toString() !== userId.toString()) {
        const message = `Cannot ${label} when it is not your turn.`
        this.logger.warn(`${this.logPrefix} getGamePlayer failed: ${message}`)
        throw new PresentableError(message)
      }
    }

    return {
      game,
      player: players[0],
    }
  }
}

export interface GamePlayerResponse {
  game: GameDbObject
  player: GamePlayerDbObject
}
