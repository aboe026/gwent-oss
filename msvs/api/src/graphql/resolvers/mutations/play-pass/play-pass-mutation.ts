import { Context } from '@gwent/graphql-schema/context'
import { Game, MutationPlayPassArgs } from '@gwent/graphql-schema/resolver-typings'
import { GraphQLResolveInfo } from 'graphql'
import PlayPassImplementation from './play-pass-implementation'
import PlayPassResolution from './play-pass-resolution'
import PlayPassValidation from './play-pass-validation'

/**
 * A class for executing the playPass GraphQL Mutation.
 */
export default class PlayPassMutation {
  /**
   * Pass the rest of the round for a user. Once a round is passed, the user can no longer play units the rest of the round.
   *
   * @param args The arguments for passing the round.
   * @param context The session containing the user passing.
   * @param info The information about the GraphQL request.
   * @returns The Game with the round passed for the user.
   */
  static async playPassMutation(args: MutationPlayPassArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const {
      game,
      logPrefix,
      userId, //
    } = await PlayPassValidation.playPassValidation(args, context, info)

    const {
      game: updatedGame,
      roundOver, //
    } = await PlayPassImplementation.playPassImplementation({
      game,
      logPrefix,
      userId,
    })

    return PlayPassResolution.playPassResolution({
      game: updatedGame,
      logPrefix,
      roundOver,
      userId,
    })
  }
}
