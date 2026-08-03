import { getLogger } from 'log4js'

import { Deck, DeckUnit } from '@gwent-oss/graphql-schema/resolver-typings'
import { DeckAddedPayload } from '../../subscription-resolver'
import DeckResolver from '../../types/deck-resolver'
import EventManager from '../../../event-manager'
import FactionResolver from '../../types/faction-resolver'
import LeaderResolver from '../../types/leader-resolver'
import { PubSubEvents } from '@gwent-oss/constants'
import { DeckDbObject, FactionDbObject, LeaderDbObject } from '@gwent-oss/graphql-schema/database-typings'

/**
 * A class for resolving the addDeck GraphQL Mutation.
 */
export default class AddDeckResolution {
  private static logger = getLogger('AddDeckResolution')

  /**
   * Resolve a newly added deck for a user, passing it back on the request and publishing it for subscriptions.
   *
   * @param config The configuration used to resolve the new deck.
   * @param config.deck The new deck that was added.
   * @param config.deckUnits The DeckUnits that comprise the new deck.
   * @param config.faction The faction the new deck was created for.
   * @param config.leader The leader for the new deck.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @returns The Deck that was added with fields resolved.
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
