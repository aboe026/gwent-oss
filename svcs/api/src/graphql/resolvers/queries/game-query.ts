import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { Game, QueryGameArgs } from '@gwent/graphql-schema/resolver-typings'
import GameResolver from '../types/game-resolver'
import { GraphQLResolveInfo } from 'graphql'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import { RequestedFields } from '@gwent/graphql-schema'

/**
 * A class for executing the game GraphQL Query.
 */
export default class GameQuery {
  private static logger = getLogger('GameQuery')

  /**
   * Gets a specific Game by ID.
   *
   * @param context The session containing the user getting the game.
   * @param info The information about the GraphQL request.
   * @returns The Game with the given ID.
   */
  static async game(args: QueryGameArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const userId = context.session?.user?._id
    if (!userId) {
      GameQuery.logger.error(`No user on context for game query: "${JSON.stringify(context.session)}".`)
      return Error(NOT_AUTHENTICATED_MESSAGE) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const logPrefix = `game by "${userId}"`
    if (GameQuery.logger.isTraceEnabled()) {
      GameQuery.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
      GameQuery.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      GameQuery.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }
    const gameId = args.id
    return GameResolver.fromId(gameId)
  }
}
