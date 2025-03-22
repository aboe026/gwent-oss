import { Context } from '@gwent/graphql-schema/context'
import { GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import { getLogger } from 'log4js'
import { GraphQLResolveInfo } from 'graphql'
import { MutationPlayPassArgs } from '@gwent/graphql-schema/resolver-typings'
import PresentableError from '../../../../util/presentable-error'
import ResolverUtil from '../../resolver-util'

/**
 * A class for executing the playPass GraphQL Mutation.
 */
export default class PlayPassValidation {
  private static logger = getLogger('PlayPassValidation')

  /**
   * Pass the rest of the round for a user. Once a round is passed, the user can no longer play units the rest of the round.
   *
   * @param args The arguments for passing the round.
   * @param context The session containing the user passing.
   * @param info The information about the GraphQL request.
   * @returns The Game with the round passed for the user.
   * @throws PresentableError if problem playing pass.
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

interface ValidatedPlayPass {
  game: GameDbObject
  logPrefix: string
}
