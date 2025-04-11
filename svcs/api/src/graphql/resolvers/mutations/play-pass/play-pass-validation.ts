import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import { GraphQLResolveInfo } from 'graphql'
import { MutationPlayPassArgs } from '@gwent/graphql-schema/resolver-typings'
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
   * @throws PresentableError if known problem playing pass.
   */
  static async playPassValidation(
    args: MutationPlayPassArgs,
    context: Context,
    info: GraphQLResolveInfo
  ): Promise<ValidatedPlayPass> {
    const resolverUtil = new ResolverUtil({
      logger: PlayPassValidation.logger,
    })
    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'playPass mutation',
    })
    const gameId = args.game

    const logPrefix = `playPass by "${userId}" on game "${gameId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    const { game, player } = await resolverUtil.getGamePlayer({
      gameId,
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
