import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { Game, QueryGameArgs } from '@gwent/graphql-schema/resolver-typings'
import GameResolver from '../types/game-resolver'
import { GraphQLResolveInfo } from 'graphql'
import ResolverUtil from '../resolver-util'

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
    const resolverUtil = new ResolverUtil({
      logger: GameQuery.logger,
    })
    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'game query',
    })

    const logPrefix = `game by "${userId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    const gameId = args.id
    resolverUtil.verifyMongoIds({
      ids: [gameId],
      label: 'Game ID',
    })

    return GameResolver.fromId(gameId)
  }
}
