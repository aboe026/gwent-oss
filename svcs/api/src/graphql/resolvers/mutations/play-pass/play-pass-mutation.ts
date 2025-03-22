import { Context } from '@gwent/graphql-schema/context'
import EventManager from '../../../event-manager'
import { Game, MutationPlayPassArgs } from '@gwent/graphql-schema/resolver-typings'
import GameDeckResolver from '../../types/game-deck-resolver'
import GameResolver from '../../types/game-resolver'
import { getLogger } from 'log4js'
import { GraphQLResolveInfo } from 'graphql'
import { PassPlayedPayload, RoundEndedForDeckPayload } from '../../subscription-resolver'
import PlayPassImplementation from './play-pass-implementation'
import PlayPassValidation from './play-pass-validation'
import { PubSubEvents } from '@gwent/constants'

/**
 * A class for executing the playPass GraphQL Mutation.
 */
export default class PlayPassMutation {
  private static logger = getLogger('PlayPassMutation')

  /**
   * Pass the rest of the round for a user. Once a round is passed, the user can no longer play units the rest of the round.
   *
   * @param args The arguments for passing the round.
   * @param context The session containing the user passing.
   * @param info The information about the GraphQL request.
   * @returns The Game with the round passed for the user.
   * @throws PresentableError if problem playing pass.
   */
  static async playPassMutation(args: MutationPlayPassArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const {
      game,
      logPrefix, //
    } = await PlayPassValidation.playPassValidation(args, context, info)

    const {
      game: updatedGame,
      roundOver, //
    } = await PlayPassImplementation.playPassImplementation({
      game,
      logPrefix,
    })

    const resolvedGame = await GameResolver.fromObject({
      game: updatedGame,
    })

    EventManager.pubsub.publish(PubSubEvents.PassPlayed, {
      passPlayed: resolvedGame,
    } as PassPlayedPayload)

    if (roundOver) {
      for (const gamePlayer of updatedGame.players) {
        EventManager.pubsub.publish(PubSubEvents.RoundEndedForDeck, {
          roundEndedForDeck: {
            deck: await GameDeckResolver.fromObject({
              gameDeck: gamePlayer.deck,
            }),
            game: resolvedGame,
          },
        } as RoundEndedForDeckPayload)
      }
    }

    return resolvedGame
  }
}
