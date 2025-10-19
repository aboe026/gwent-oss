import { Context } from '@gwent/graphql-schema/context'
import { DeckUnit, MutationRedrawArgs } from '@gwent/graphql-schema/resolver-typings'
import { GraphQLResolveInfo } from 'graphql'
import RedrawImplementation from './redraw-implementation'
import RedrawResolution from './redraw-resolution'
import RedrawValidation from './redraw-validation'

/**
 * A class for executing the redraw GraphQL Mutation.
 */
export default class RedrawMutation {
  /**
   * Redraw a Unit of a Game for a random Unit from their undrawn Units.
   *
   * @param args The arguments for redrawing a unit.
   * @param context The session containing the user redrawing the unit.
   * @param info The information about the GraphQL request.
   * @returns The random DeckUnit that replaces their redrawn Unit in their hand.
   */
  static async redrawMutation(args: MutationRedrawArgs, context: Context, info: GraphQLResolveInfo): Promise<DeckUnit> {
    const {
      game,
      logPrefix,
      unitId,
      userId, //
    } = await RedrawValidation.redrawValidation(args, context, info)

    const {
      from,
      game: updatedGame,
      to, //
    } = await RedrawImplementation.redrawImplementation({
      game,
      logPrefix,
      unitId,
      userId,
    })

    return RedrawResolution.redrawResolution({
      from,
      game: updatedGame,
      gameDeck: updatedGame.players.find((player) => player.user.toString() === userId.toString())?.deck,
      logPrefix,
      to,
    })
  }
}
