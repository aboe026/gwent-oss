import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { GameDbObject, GameDeckDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import { GraphQLResolveInfo } from 'graphql'
import { MutationSetOrderArgs } from '@gwent/graphql-schema/resolver-typings'
import ResolverUtil from '../../resolver-util'

/**
 * A class for executing the setOrder GraphQL Mutation.
 */
export default class SetOrderValidation {
  private static logger = getLogger('SetOrderValidation')

  /**
   * Set the player turn order for a Game.
   *
   * @param args The arguments for setting the order of a game.
   * @param context The session containing the user setting the order.
   * @param info The information about the GraphQL request.
   * @returns The Game with player turn orders set.
   */
  static async setOrderValidation(
    args: MutationSetOrderArgs,
    context: Context,
    info: GraphQLResolveInfo
  ): Promise<ValidatedSetOrder> {
    const resolverUtil = new ResolverUtil({
      logger: SetOrderValidation.logger,
    })
    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'setOrder mutation',
    })
    const gameId = args.game
    const userIds = args.users

    const logPrefix = `setOrder by "${userId}" to users "${JSON.stringify(userIds)}" on game "${gameId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    resolverUtil.verifyMongoIds({
      ids: [gameId],
      label: 'Game ID',
    })
    if (userIds) {
      resolverUtil.verifyMongoIds({
        ids: userIds,
        label: 'User ID',
      })
    }

    const { game, player } = await resolverUtil.getGamePlayer({
      gameId,
      userId,
      label: 'set order',
      status: GameStatus.Ordering,
    })

    return {
      game,
      gameDeck: player.deck,
      logPrefix,
      userIds,
    }
  }
}

interface ValidatedSetOrder {
  game: GameDbObject
  gameDeck: GameDeckDbObject
  logPrefix: string
  userIds?: string[] | null
}
