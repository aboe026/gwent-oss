import { Context } from '@gwent/graphql-schema/context'
import { Game, MutationSetOrderArgs } from '@gwent/graphql-schema/resolver-typings'
import { GraphQLResolveInfo } from 'graphql'
import SetGameTurnOrder from '../util/set-game-turn-order'
import SetOrderValidation from './set-order-validation'

/**
 * A class for executing the setOrder GraphQL Mutation.
 */
export default class SetOrderMutation {
  /**
   * Set the player turn order for a Game.
   *
   * @param args The arguments for setting the order of a game.
   * @param context The session containing the user setting the order.
   * @param info The information about the GraphQL request.
   * @returns The Game with player turn orders set.
   */
  static async setOrderMutation(args: MutationSetOrderArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const {
      game,
      gameDeck,
      logPrefix,
      userIds,
      userId, //
    } = await SetOrderValidation.setOrderValidation(args, context, info)

    return SetGameTurnOrder.setGameTurnOrder({
      game,
      gameDeck,
      userIds,
      allowImplicit: true,
      logPrefix,
      userId,
    })
  }
}
