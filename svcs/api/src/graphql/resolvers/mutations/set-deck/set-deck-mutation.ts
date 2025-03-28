import { Context } from '@gwent/graphql-schema/context'
import { GameDeck, MutationSetDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import { GraphQLResolveInfo } from 'graphql'
import SetDeckImplementation from './set-deck-implementation'
import SetDeckResolution from './set-deck-resolution'
import SetDeckValidation from './set-deck-validation'

/**
 * A class for executing the setDeck GraphQL Mutation.
 */
export default class SetDeckMutation {
  /**
   * Sets a Deck for a Game. Deck cannot be changed after set.
   *
   * @param args The arguments for setting a deck.
   * @param context The session containing the user setting the deck.
   * @param info The information about the GraphQL request.
   * @returns The GameDeck that was set for the game.
   * @throws PresentableError if problem setting deck.
   */
  static async setDeckMutation(
    args: MutationSetDeckArgs,
    context: Context,
    info: GraphQLResolveInfo
  ): Promise<GameDeck> {
    const {
      deck,
      game,
      logPrefix,
      userId, //
    } = await SetDeckValidation.setDeckValidation(args, context, info)

    const {
      gameDeck,
      game: updatedGame, //
    } = await SetDeckImplementation.setDeckImplementation({
      deck,
      game,
      logPrefix,
      userId,
    })

    return SetDeckResolution.setDeckResolution({
      game: updatedGame,
      gameDeck,
      logPrefix,
    })
  }
}
