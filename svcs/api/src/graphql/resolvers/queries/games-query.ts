import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { Game } from '@gwent/graphql-schema/resolver-typings'
import GameResolver from '../types/game-resolver'
import GameStore from '../../../database/stores/game-store'
import { GraphQLResolveInfo } from 'graphql'
import ResolverUtil from '../resolver-util'

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
    const resolverUtil = new ResolverUtil({
      logger: GamesQuery.logger,
    })
    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'games query',
    })

    const logPrefix = `games by "${userId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.logRequestInfo({
      info,
    })

    const games = await GameStore.getByUserId(userId)
    if (GamesQuery.logger.isTraceEnabled()) {
      GamesQuery.logger.trace(`${logPrefix} games: "${JSON.stringify(games)}"`)
    }
    return GameResolver.fromArray(games)
  }
}
