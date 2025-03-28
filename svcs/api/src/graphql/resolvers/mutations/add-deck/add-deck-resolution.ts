import { getLogger } from 'log4js'

import { Deck, DeckUnit } from '@gwent/graphql-schema/resolver-typings'
import { DeckAddedPayload } from '../../subscription-resolver'
import DeckResolver from '../../types/deck-resolver'
import EventManager from '../../../event-manager'
import FactionResolver from '../../types/faction-resolver'
import LeaderResolver from '../../types/leader-resolver'
import { PubSubEvents } from '@gwent/constants'
import { DeckDbObject, FactionDbObject, LeaderDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * A class for executing the addDeck GraphQL Mutation.
 */
export default class AddDeckResolution {
  private static logger = getLogger('AddDeckResolution')

  /**
   * Add a Deck for a user.
   *
   * @param args The arguments for adding a deck.
   * @param context The session containing the user adding the deck.
   * @param info The information about the GraphQL request.
   * @returns The Deck that was added.
   * @throws PresentableError if problem adding deck.
   */
  static async addDeckResolution({
    deck,
    deckUnits,
    faction,
    leader,
    logPrefix,
  }: {
    deck: DeckDbObject
    deckUnits: DeckUnit[]
    faction: FactionDbObject
    leader: LeaderDbObject
    logPrefix: string
  }): Promise<Deck> {
    const resolvedFaction = await FactionResolver.fromObject({
      faction,
    })
    if (AddDeckResolution.logger.isTraceEnabled()) {
      AddDeckResolution.logger.trace(`${logPrefix} resolvedFaction: "${JSON.stringify(resolvedFaction)}"`)
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
    if (AddDeckResolution.logger.isTraceEnabled()) {
      AddDeckResolution.logger.trace(`${logPrefix} resolvedDeck: "${JSON.stringify(resolvedDeck)}"`)
    }

    EventManager.pubsub.publish(PubSubEvents.DeckAdded, {
      deckAdded: resolvedDeck,
    } as DeckAddedPayload)

    return resolvedDeck
  }
}
