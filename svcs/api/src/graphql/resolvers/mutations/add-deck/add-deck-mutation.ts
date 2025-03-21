import { getLogger } from 'log4js'

import AddDeckImplementation from './add-deck-implementation'
import AddDeckValidation from './add-deck-validation'
import { Context } from '@gwent/graphql-schema/context'
import { Deck, MutationAddDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import { DeckAddedPayload } from '../../subscription-resolver'
import DeckResolver from '../../types/deck-resolver'
import EventManager from '../../../event-manager'
import FactionResolver from '../../types/faction-resolver'
import { GraphQLResolveInfo } from 'graphql'
import LeaderResolver from '../../types/leader-resolver'
import { PubSubEvents } from '@gwent/constants'

/**
 * A class for executing the addDeck GraphQL Mutation.
 */
export default class AddDeckMutation {
  private static logger = getLogger('AddDeckMutation')

  /**
   * Add a Deck for a user.
   *
   * @param args The arguments for adding a deck.
   * @param context The session containing the user adding the deck.
   * @param info The information about the GraphQL request.
   * @returns The Deck that was added.
   * @throws PresentableError if problem adding deck.
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

    const resolvedFaction = await FactionResolver.fromObject({
      faction,
    })
    if (AddDeckMutation.logger.isTraceEnabled()) {
      AddDeckMutation.logger.trace(`${logPrefix} resolvedFaction: "${JSON.stringify(resolvedFaction)}"`)
    }
    const resolvedDeck = await DeckResolver.fromObject({
      deck,
      faction: resolvedFaction,
      leader: await LeaderResolver.fromObject({
        leader,
        faction: resolvedFaction,
      }),
      units: deckUnits,
    })
    if (AddDeckMutation.logger.isTraceEnabled()) {
      AddDeckMutation.logger.trace(`${logPrefix} resolvedDeck: "${JSON.stringify(resolvedDeck)}"`)
    }

    EventManager.pubsub.publish(PubSubEvents.DeckAdded, {
      deckAdded: resolvedDeck,
    } as DeckAddedPayload)

    return resolvedDeck
  }
}
