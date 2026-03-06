import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { Game, QueryGameArgs } from '@gwent/graphql-schema/resolver-typings'
import GameResolver from '../types/game-resolver'
import { GraphQLResolveInfo } from 'graphql'
import Permissions from '../../permissions'
import ResolverUtil from '../resolver-util'

/**
 * A class for executing the game GraphQL Query.
 */
export default class GameQuery {
  private static logger = getLogger('GameQuery')

  /**
   * Gets a specific Game by ID.
   *
   * @param args The arguments the user supplied to the query.
   * @param context The session containing the user getting the game.
   * @param info The information about the GraphQL request.
   * @returns The Game with the given ID.
   */
  static async game(args: QueryGameArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const { _id: userId } = Permissions.isAuthenticated({
      context,
      label: 'game query',
    })
    const { game } = await Permissions.isGamePlayer({
      gameId: args.id,
      userId,
      label: 'game query',
    })

    const logPrefix = `game by "${userId}"`
    const resolverUtil = new ResolverUtil({
      logger: GameQuery.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    return GameResolver.fromObject({
      game,
      userId,
    })
  }
}
