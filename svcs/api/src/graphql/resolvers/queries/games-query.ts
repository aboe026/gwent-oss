import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { Game } from '@gwent/graphql-schema/resolver-typings'
import GameResolver from '../types/game-resolver'
import GameStore from '../../../database/stores/game-store'
import { GraphQLResolveInfo } from 'graphql'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import { RequestedFields } from '@gwent/graphql-schema'

/**
 * A class for executing the games GraphQL Query.
 */
export default class GamesQuery {
  private static logger = getLogger('GamesQuery')

  /**
   * Gets all Games a user is apart of.
   *
   * @param context The session containing the user to get the games of.
   * @param info The information about the GraphQL request.
   * @returns The Games a user is apart of.
   */
  static async games(context: Context, info: GraphQLResolveInfo): Promise<Game[]> {
    const userId = context.session?.user?._id
    if (!userId) {
      GamesQuery.logger.error(`No user on context for games query: "${JSON.stringify(context.session)}".`)
      return Error(NOT_AUTHENTICATED_MESSAGE) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const logPrefix = `games by "${userId}"`
    if (GamesQuery.logger.isTraceEnabled()) {
      GamesQuery.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      GamesQuery.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }
    const games = await GameStore.getByUserId(userId)
    if (GamesQuery.logger.isTraceEnabled()) {
      GamesQuery.logger.trace(`${logPrefix} games: "${JSON.stringify(games)}"`)
    }
    return GameResolver.fromArray(games)
  }
}
