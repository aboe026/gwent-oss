import { Context } from '@gwent-oss/graphql-schema/context'
import { Game, MutationReadyArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import { GraphQLResolveInfo } from 'graphql'
import ReadyImplementation from './ready-implementation'
import ReadyResolution from './ready-resolution'
import ReadyValidation from './ready-validation'

/**
 * A class for executing the ready GraphQL Mutation.
 */
export default class ReadyMutation {
  /**
   * Mark a Game as ready for a User. Prevents redrawing units after marked as ready.
   *
   * @param args The arguments for marking a game as ready.
   * @param context The session containing the user readying the game.
   * @param info The information about the GraphQL request.
   * @returns The Game that is now ready for the user.
   */
  static async readyMutation(args: MutationReadyArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const {
      logPrefix,
      game,
      userId, //
    } = await ReadyValidation.readyValidation(args, context, info)

    const updatedGame = await ReadyImplementation.readyImplementation({
      game,
      logPrefix,
      userId,
    })

    return ReadyResolution.readyResolution({
      game: updatedGame,
      logPrefix,
      userId,
    })
  }
}
