import { Logger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { GameDbObject, GamePlayerDbObject, GameStatus, UserDbObject } from '@gwent/graphql-schema/database-typings'
import GameResolver from './types/game-resolver'
import GameStore from '../../database/stores/game-store'
import { GraphQLResolveInfo } from 'graphql'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import PresentableError from '../../util/presentable-error'
import { RequestedFields } from '@gwent/graphql-schema'

export default class ResolverUtil {
  private logger: Logger
  private logPrefix: string

  constructor({ logger, logPrefix = '' }: { logger: Logger; logPrefix?: string }) {
    this.logger = logger
    this.logPrefix = logPrefix
  }

  setLogPrefix(logPrefix: string) {
    this.logPrefix = logPrefix
  }

  getContextUser({ context, label }: { context: Context; label: string }): UserDbObject {
    const userId = context.session?.user
    if (!userId || !userId._id) {
      this.logger.error(`No user on context for ${label}: "${JSON.stringify(context.session)}".`)
      throw Error(NOT_AUTHENTICATED_MESSAGE) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    return userId
  }

  verifyMongoIds({ ids, label }: { ids: string[]; label: string }) {
    for (const id of ids) {
      if (!ObjectId.isValid(id)) {
        const message = `${label} "${id}" is not a valid MongoDB ObjectId.`
        this.logger.warn(`${this.logPrefix} failed: ${message}`)
        return new PresentableError({
          code: 1001,
          message,
        })
      }
    }
  }

  printArgsAndInfo({
    args,
    info,
  }: {
    args?: any // eslint-disable-line @typescript-eslint/no-explicit-any
    info: GraphQLResolveInfo
  }) {
    if (this.logger.isTraceEnabled()) {
      if (args) {
        this.logger.trace(`${this.logPrefix} args: "${JSON.stringify(args)}"`)
      }
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
   * @returns The game and player if they exist, otherwise an Error.
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
      throw new PresentableError({
        code: 1021,
        message,
      })
    }
    const players: GamePlayerDbObject[] = game.players.filter((player) => player.user.toString() === userId.toString())
    if (this.logger.isTraceEnabled()) {
      this.logger.trace(`${this.logPrefix} getGamePlayer game "${game._id}" players: "${JSON.stringify(players)}"`)
    }
    if (players.length === 0) {
      const message = `Not a player on game "${gameId}".`
      this.logger.warn(`${this.logPrefix} getGamePlayer failed: ${message}`)
      throw new PresentableError({
        code: 1022,
        message,
      })
    }
    if (players.length > 1) {
      const message = `Found more than 1 player with ID "${userId}" on game "${gameId}"`
      this.logger.error(`${this.logPrefix} getGamePlayer failed: ${message}: "${JSON.stringify(players)}"`)
      throw Error(`${message}.`)
    }

    if (status) {
      const gameStatus = GameResolver.getStatus(game)
      if (gameStatus !== status) {
        const message = `Invalid game status "${gameStatus}": Can only ${label} for game with status "${status}".`
        this.logger.warn(`${this.logPrefix} getGamePlayer failed: ${message}`)
        throw new PresentableError({
          code: 1023,
          message,
        })
      }
    }

    if (turn) {
      if (game.turn?.toString() !== userId.toString()) {
        const message = `Cannot ${label} when it is not your turn.`
        this.logger.warn(`${this.logPrefix} getGamePlayer failed: ${message}`)
        throw new PresentableError({
          code: 1024,
          message,
        })
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
