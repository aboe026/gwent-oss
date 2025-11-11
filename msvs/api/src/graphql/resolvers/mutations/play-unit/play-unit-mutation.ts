import { Context } from '@gwent/graphql-schema/context'
import { Game, MutationPlayUnitArgs } from '@gwent/graphql-schema/resolver-typings'
import { GraphQLResolveInfo } from 'graphql'
import PlayUnitImplementation from './play-unit-implementation'
import PlayUnitResolution from './play-unit-resolution'
import PlayUnitValidation from './play-unit-validation'

/**
 * A class for executing the playUnit GraphQL Mutation.
 */
export default class PlayUnitMutation {
  /**
   * Play a unit for a user on a game.
   *
   * @param args The arguments for playing the unit.
   * @param context The session containing the user playing the unit.
   * @param info The information about the GraphQL request.
   * @returns The Game with the unit played for the user.
   */
  static async playUnitMutation(args: MutationPlayUnitArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const {
      combat,
      deckUnit,
      game,
      logPrefix,
      unit,
      targetId, //
    } = await PlayUnitValidation.playUnitValidation(args, context, info)

    const {
      game: updatedGame,
      gameDeck, //
    } = await PlayUnitImplementation.playUnitImplementation({
      combat,
      deckUnit,
      game,
      logPrefix,
      unit,
      targetId,
    })

    return PlayUnitResolution.playUnitResolution({
      deckUnit,
      game: updatedGame,
      gameDeck,
      logPrefix,
    })
  }
}
