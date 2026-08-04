import AddDeckImplementation from './add-deck-implementation'
import AddDeckResolution from './add-deck-resolution'
import AddDeckValidation from './add-deck-validation'
import { Context } from '@gwent-oss/graphql-schema/context'
import { Deck, MutationAddDeckArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import { GraphQLResolveInfo } from 'graphql'

/**
 * A class for executing the addDeck GraphQL Mutation.
 */
export default class AddDeckMutation {
  /**
   * Add a Deck for a user.
   *
   * @param args The arguments for adding a deck.
   * @param context The session containing the user adding the deck.
   * @param info The information about the GraphQL request.
   * @returns The Deck that was added.
   */
  static async addDeckMutation(args: MutationAddDeckArgs, context: Context, info: GraphQLResolveInfo): Promise<Deck> {
    const {
      deckUnits,
      faction,
      leader,
      logPrefix,
      name,
      userId, //
    } = await AddDeckValidation.addDeckValidation(args, context, info)

    const deck = await AddDeckImplementation.addDeckImplementation({
      deckUnits,
      faction,
      leader,
      logPrefix,
      name,
      userId,
    })

    return AddDeckResolution.addDeckResolution({
      deck,
      deckUnits,
      faction,
      leader,
      logPrefix,
    })
  }
}
