import { getLogger } from 'log4js'

import { DeckDbObject } from '@gwent/graphql-schema/database-typings'
import DeckStore from '../../../../database/stores/deck-store'
import { getDeckStats } from '@gwent/utils'
import PresentableError from '../../../../util/presentable-error'
import { ValidatedAddDeck } from './add-deck-validation'

/**
 * A class for executing the addDeck GraphQL Mutation.
 */
export default class AddDeckImplementation {
  private static logger = getLogger('AddDeck')

  /**
   * Add a Deck for a user.
   *
   * @param args The arguments for adding a deck.
   * @param context The session containing the user adding the deck.
   * @param info The information about the GraphQL request.
   * @returns The Deck that was added.
   * @throws PresentableError if problem adding deck.
   */
  static async addDeckImplementation({
    deckUnits,
    faction,
    leader,
    logPrefix,
    name,
    userId,
  }: ValidatedAddDeck): Promise<DeckDbObject> {
    let deck: DeckDbObject
    try {
      deck = await DeckStore.add({
        factionId: faction._id,
        leaderId: leader._id,
        name,
        stats: getDeckStats(deckUnits),
        units: deckUnits.map((deckUnit) => {
          return {
            unit: deckUnit.unit.id,
            artStyle: deckUnit.artStyle,
          }
        }),
        userId,
      })
    } catch (err: unknown) {
      if (err instanceof Error && err.message === `Deck with name "${name}" already exists for user "${userId}"`) {
        const message = `Deck with name "${name}" already exists.` // exclude user ID for security
        AddDeckImplementation.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
      AddDeckImplementation.logger.error(`${logPrefix} failed: ${err}`)
      throw err
    }
    if (AddDeckImplementation.logger.isTraceEnabled()) {
      AddDeckImplementation.logger.trace(`${logPrefix} deck: "${JSON.stringify(deck)}"`)
    }

    return deck
  }
}
