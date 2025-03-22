import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import EventManager from '../../../event-manager'
import { Game, MutationAddGameArgs } from '@gwent/graphql-schema/resolver-typings'
import { GameAddedPayload } from '../../subscription-resolver'
import GameResolver from '../../types/game-resolver'
import { GraphQLResolveInfo } from 'graphql'
import { PubSubEvents } from '@gwent/constants'
import AddGameValidation from './add-game-validation'
import AddGameImplementation from './add-game-implementation'

/**
 * A class for executing the addGame GraphQL Mutation.
 */
export default class AddGameMutation {
  private static logger = getLogger('AddGameMutation')

  /**
   * Add a Game for a user.
   *
   * @param args The arguments for adding a game.
   * @param context The session containing the user adding the game.
   * @param info The information about the GraphQL request.
   * @returns The Game that was added.
   * @throws PresentableError if problem adding game.
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

    const resolvedGame = await GameResolver.fromObject({
      game,
      users: opponents,
    })

    EventManager.pubsub.publish(PubSubEvents.GameAdded, {
      gameAdded: resolvedGame,
    } as GameAddedPayload)

    return resolvedGame
  }
}
