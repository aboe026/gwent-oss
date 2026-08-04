import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent-oss/graphql-schema/context'
import { GameDbObject, GameDeckDbObject, GameStatus } from '@gwent-oss/graphql-schema/database-typings'
import { GraphQLResolveInfo } from 'graphql'
import { MutationSetOrderArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import Permissions from '../../../permissions'
import ResolverUtil from '../../resolver-util'

/**
 * A class for validating the setOrder GraphQL Mutation.
 */
export default class SetOrderValidation {
  private static logger = getLogger('SetOrderValidation')

  /**
   * Validates the inputs for setting the turn order of a game.
   *
   * @param args The arguments for setting the order of a game.
   * @param context The session containing the user setting the order.
   * @param info The information about the GraphQL request.
   * @returns The information needed to set the order of the game.
   */
  static async setOrderValidation(
    args: MutationSetOrderArgs,
    context: Context,
    info: GraphQLResolveInfo
  ): Promise<ValidatedSetOrder> {
    const { _id: userId } = Permissions.isAuthenticated({
      context,
      label: 'setOrder mutation',
    })
    const { game, player } = await Permissions.isGamePlayer({
      gameId: args.game,
      userId,
      label: 'setOrder mutation',
    })
    const userIds = args.users

    const logPrefix = `setOrder by "${userId}" to users "${JSON.stringify(userIds)}" on game "${game._id}"`
    const resolverUtil = new ResolverUtil({
      logger: SetOrderValidation.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    if (userIds) {
      resolverUtil.verifyMongoIds({
        ids: userIds,
        label: 'User ID',
      })
    }

    resolverUtil.validateGame({
      game,
      userId,
      label: 'set order',
      status: GameStatus.Ordering,
    })

    return {
      game,
      gameDeck: player.deck,
      logPrefix,
      userIds,
      userId,
    }
  }
}

export interface ValidatedSetOrder {
  game: GameDbObject
  gameDeck: GameDeckDbObject
  logPrefix: string
  userIds?: string[] | null
  userId: ObjectId
}
