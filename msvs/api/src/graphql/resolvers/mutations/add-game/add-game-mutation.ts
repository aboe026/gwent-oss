import AddGameImplementation from './add-game-implementation'
import AddGameResolution from './add-game-resolution'
import AddGameValidation from './add-game-validation'
import { Context } from '@gwent/graphql-schema/context'
import { Game, MutationAddGameArgs } from '@gwent/graphql-schema/resolver-typings'
import { GraphQLResolveInfo } from 'graphql'

/**
 * A class for executing the addGame GraphQL Mutation.
 */
export default class AddGameMutation {
  /**
   * Add a Game for a user.
   *
   * @param args The arguments for adding a game.
   * @param context The session containing the user adding the game.
   * @param info The information about the GraphQL request.
   * @returns The Game that was added.
   */
  static async addGameMutation(args: MutationAddGameArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const {
      logPrefix,
      opponents,
      userId, //
    } = await AddGameValidation.addGameValidation(args, context, info)

    const game = await AddGameImplementation.AddGameImplementation({
      logPrefix,
      opponents,
      userId,
    })

    return AddGameResolution.addGameResolution({
      game,
      logPrefix,
      opponents,
      creatorId: userId,
    })
  }
}
