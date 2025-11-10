import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import { GraphQLResolveInfo } from 'graphql'
import { MutationPlayPassArgs } from '@gwent/graphql-schema/resolver-typings'
import Permissions from '../../../permissions'
import PresentableError from '../../../../util/presentable-error'
import ResolverUtil from '../../resolver-util'

/**
 * A class for validating the playPass GraphQL Mutation.
 */
export default class PlayPassValidation {
  private static logger = getLogger('PlayPassValidation')

  /**
   * Validates the inputs for a user to pass in a game.
   *
   * @param args The arguments for passing the round.
   * @param context The session containing the user passing.
   * @param info The information about the GraphQL request.
   * @returns The information needed to pass in the game.
   * @throws {PresentableError} if known problem playing pass.
   */
  static async playPassValidation(
    args: MutationPlayPassArgs,
    context: Context,
    info: GraphQLResolveInfo
  ): Promise<ValidatedPlayPass> {
    const { _id: userId } = Permissions.isAuthenticated({
      context,
      label: 'playPass mutation',
    })
    const { game, player } = await Permissions.isGamePlayer({
      gameId: args.game,
      userId,
      label: 'playPass mutation',
    })
    const gameId = args.game

    const logPrefix = `playPass by "${userId}" on game "${gameId}"`
    const resolverUtil = new ResolverUtil({
      logger: PlayPassValidation.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    resolverUtil.validateGame({
      game,
      userId,
      status: GameStatus.Playing,
      turn: true,
      label: 'pass round',
    })

    const playerRound = player.rounds[game.round - 1]
    if (!playerRound) {
      const message = `Could not get round "${game.round}" for player "${player.user}"`
      PlayPassValidation.logger.error(`${logPrefix} failed: ${message}: "${JSON.stringify(player.rounds)}"`)
      throw new PresentableError(message)
    }
    if (playerRound.passed) {
      const message = `Already passed round "${game.round}"`
      PlayPassValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    return {
      game,
      logPrefix,
    }
  }
}

export interface ValidatedPlayPass {
  game: GameDbObject
  logPrefix: string
}
