import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import EventManager from '../../../event-manager'
import { Game, MutationReadyArgs } from '@gwent/graphql-schema/resolver-typings'
import { GameReadyPayload } from '../../subscription-resolver'
import GameResolver from '../../types/game-resolver'
import { GraphQLResolveInfo } from 'graphql'
import { PubSubEvents } from '@gwent/constants'
import ReadyImplementation from './ready-implementation'
import ReadyValidation from './ready-validation'

/**
 * A class for executing the ready GraphQL Mutation.
 */
export default class ReadyMutation {
  private static logger = getLogger('ReadyMutation')

  /**
   * Mark a Game as ready for a User. Prevents redrawing units after marked as ready.
   *
   * @param args The arguments for marking a game as ready.
   * @param context The session containing the user readying the game.
   * @param info The information about the GraphQL request.
   * @returns The Game that is now ready for the user.
   * @throws PresentableError if problem marking game as ready.
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

    const resolvedGame = await GameResolver.fromObject({
      game: updatedGame,
    })

    EventManager.pubsub.publish(PubSubEvents.GameReady, {
      gameReady: resolvedGame,
    } as GameReadyPayload)

    return resolvedGame
  }
}
