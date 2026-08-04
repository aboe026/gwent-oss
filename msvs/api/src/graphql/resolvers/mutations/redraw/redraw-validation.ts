import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent-oss/graphql-schema/context'
import { GameDbObject, GameStatus } from '@gwent-oss/graphql-schema/database-typings'
import { GraphQLResolveInfo } from 'graphql'
import { MAX_REDRAWS } from '@gwent-oss/constants'
import { MutationRedrawArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import Permissions from '../../../permissions'
import PresentableError from '../../../../util/presentable-error'
import ResolverUtil from '../../resolver-util'

/**
 * A class for validating the redraw GraphQL Mutation.
 */
export default class RedrawValidation {
  private static logger = getLogger('RedrawValidation')

  /**
   * Validates the inputs for redrawing a unit for a game.
   *
   * @param args The arguments for redrawing a unit.
   * @param context The session containing the user redrawing the unit.
   * @param info The information about the GraphQL request.
   * @returns The information needed to redraw the unit.
   * @throws {PresentableError} if known problem redrawing unit.
   */
  static async redrawValidation(
    args: MutationRedrawArgs,
    context: Context,
    info: GraphQLResolveInfo
  ): Promise<ValidatedRedraw> {
    const { _id: userId } = Permissions.isAuthenticated({
      context,
      label: 'redraw mutation',
    })
    const { game, player } = await Permissions.isGamePlayer({
      gameId: args.game,
      userId,
      label: 'redraw mutation',
    })
    const unitId = args.unit

    const logPrefix = `redraw by "${userId}" for unit "${unitId}" on game "${game._id}"`
    const resolverUtil = new ResolverUtil({
      logger: RedrawValidation.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    resolverUtil.verifyMongoIds({
      ids: [unitId],
      label: 'Unit ID',
    })

    resolverUtil.validateGame({
      game,
      userId,
      status: GameStatus.Redrawing,
      label: 'redraw',
    })

    if (player.ready) {
      const message = 'Redraw not allowed after game marked as ready.'
      RedrawValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    if (player.deck.redraws.length >= MAX_REDRAWS) {
      const message = `Cannot exceed maximum redraw limit of "${MAX_REDRAWS}".`
      RedrawValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    return {
      game,
      logPrefix,
      unitId,
      userId,
    }
  }
}

export interface ValidatedRedraw {
  game: GameDbObject
  logPrefix: string
  unitId: string
  userId: ObjectId
}
