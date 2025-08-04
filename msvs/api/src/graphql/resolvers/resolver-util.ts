import { Logger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import {
  GameDbObject,
  GamePlayerDbObject,
  GameStatus,
  GameUnitDbObject,
  ImpactDbObject,
  MoveDbObject,
  MoveUnitDbObject,
  UserDbObject,
} from '@gwent/graphql-schema/database-typings'
import GameStore from '../../database/stores/game-store'
import { GraphQLResolveInfo } from 'graphql'
import { MoveType, RequestedFields } from '@gwent/graphql-schema'
import { NOT_AUTHENTICATED_MESSAGE, REDACTED } from '@gwent/constants'
import PresentableError from '../../util/presentable-error'
import { Unit, User } from '@gwent/graphql-schema/resolver-typings'
import UnitResolver from './types/unit-resolver'
import UserResolver from './types/user-resolver'

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
   * @param config The configuration used to print the GraphQL request information.
   * @param config.args The potential arguments on the given GraphQL request.
   * @param config.info The information on the GraphQL request.
   * @param config.secureKeys Any keys on the args that contain sensitive information and whose value should be redacted.
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
      const message = 'Game does not exist.'
      this.logger.warn(`${this.logPrefix} getGamePlayer failed: ${message}`)
      throw new PresentableError(message)
    }
    const players: GamePlayerDbObject[] = game.players.filter((player) => player.user.toString() === userId.toString())
    if (this.logger.isTraceEnabled()) {
      this.logger.trace(`${this.logPrefix} getGamePlayer players: "${JSON.stringify(players)}"`)
    }
    if (players.length === 0) {
      const message = 'Not a player on game.'
      this.logger.warn(`${this.logPrefix} getGamePlayer failed: ${message}`)
      throw new PresentableError(message)
    }
    if (players.length > 1) {
      const message = `Found more than 1 player with ID "${userId}".`
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

  static async resolveMoveUsersAndUnits({
    moves,
    impacts,
    userIds,
    gameUnits,
    presolvedUsers,
    presolvedUnits,
  }: {
    moves?: MoveDbObject[]
    impacts?: ImpactDbObject[]
    userIds?: (ObjectId | string)[]
    gameUnits?: GameUnitDbObject[]
    presolvedUsers?: User[]
    presolvedUnits?: Unit[]
  }): Promise<MoveUsersAndUnits> {
    const impactsToResolve: ImpactDbObject[] = impacts || []
    let resolvedUsers: User[] = presolvedUsers || []
    let resolvedUnits: Unit[] = presolvedUnits || []

    const userIdsToResolve: string[] = []
    const unitIdsToResolve: string[] = []

    if (!presolvedUsers && userIds) {
      for (const userId of userIds) {
        const userStringId = userId.toString()
        if (!userIdsToResolve.includes(userStringId)) {
          userIdsToResolve.push(userStringId)
        }
      }
    }

    if (gameUnits && !presolvedUnits) {
      for (const gameUnit of gameUnits) {
        const unitId = gameUnit.unit.toString()
        if (!unitIdsToResolve.includes(unitId)) {
          unitIdsToResolve.push(unitId)
        }
      }
    }

    if (moves && (!presolvedUnits || !presolvedUsers)) {
      for (const move of moves) {
        if (move.type === MoveType.Unit) {
          const unitMove = move as MoveUnitDbObject
          const unitId = unitMove.unit.unit.toString()
          if (!presolvedUnits && !unitIdsToResolve.includes(unitId)) {
            unitIdsToResolve.push(unitId)
          }
          if (!presolvedUnits && unitMove.reason.unit) {
            const reasonUnitId = unitMove.reason.unit.unit.toString()
            if (!unitIdsToResolve.includes(reasonUnitId)) {
              unitIdsToResolve.push(reasonUnitId)
            }
          }
          if (unitMove.impacts && !impacts) {
            for (const impact of unitMove.impacts) {
              impactsToResolve.push(impact)
            }
          }
          if (!presolvedUsers && !userIds && unitMove.source.user) {
            const userId = unitMove.source.user.toString()
            if (!userIdsToResolve.includes(userId)) {
              userIdsToResolve.push(userId)
            }
          }
        }
      }
    }

    for (const impact of impactsToResolve) {
      if (!presolvedUnits) {
        const impactUnitId = impact.unit.unit.toString()
        if (!unitIdsToResolve.includes(impactUnitId)) {
          unitIdsToResolve.push(impactUnitId)
        }
      }
      if (!presolvedUsers && !userIds) {
        const impactUserId = impact.user.toString()
        if (!userIdsToResolve.includes(impactUserId)) {
          userIdsToResolve.push(impactUserId)
        }
        if (impact.source?.user) {
          const impactSourceUserId = impact.source.user.toString()
          if (!userIdsToResolve.includes(impactSourceUserId)) {
            userIdsToResolve.push(impactSourceUserId)
          }
        }
      }
    }

    if (!presolvedUnits) {
      resolvedUnits = await UnitResolver.fromIds({
        ids: unitIdsToResolve,
      })
    }
    if (!presolvedUsers) {
      resolvedUsers = await UserResolver.fromIds(userIdsToResolve)
    }

    return {
      units: resolvedUnits,
      users: resolvedUsers,
    }
  }
}

export interface MoveUsersAndUnits {
  users: User[]
  units: Unit[]
}

export interface GamePlayerResponse {
  game: GameDbObject
  player: GamePlayerDbObject
}
