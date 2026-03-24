import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { Game } from '@gwent/graphql-schema/resolver-typings'
import GameResolver from '../types/game-resolver'
import GameStore from '../../../database/stores/game-store'
import { GraphQLResolveInfo } from 'graphql'
import Permissions from '../../permissions'
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
    const { _id: userId } = Permissions.isAuthenticated({
      context,
      label: 'games query',
    })

    const logPrefix = `games by "${userId}"`
    const resolverUtil = new ResolverUtil({
      logger: GamesQuery.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      info,
    })

    const games = await GameStore.getByUserId(userId)
    if (GamesQuery.logger.isTraceEnabled()) {
      GamesQuery.logger.trace(`${logPrefix} games: "${JSON.stringify(games)}"`)
    }
    const resolvedGames = await GameResolver.fromArray(games)

    return resolvedGames.map((resolvedGame) =>
      GameResolver.maskSpiedHandUnits({
        game: resolvedGame,
        userId,
      })
    )
  }
}
