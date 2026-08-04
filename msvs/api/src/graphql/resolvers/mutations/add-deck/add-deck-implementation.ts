import { getLogger } from 'log4js'

import { DeckDbObject } from '@gwent-oss/graphql-schema/database-typings'
import DeckStore from '../../../../database/stores/deck-store'
import { GetUnitStats } from '@gwent-oss/utils'
import PresentableError from '../../../../util/presentable-error'
import { ValidatedAddDeck } from './add-deck-validation'

/**
 * A class for implementing the addDeck GraphQL Mutation.
 */
export default class AddDeckImplementation {
  private static logger = getLogger('AddDeck')

  /**
   * Add a Deck for a user, saving it to the database.
   *
   * @param config The configuration used to add the deck.
   * @param config.deckUnits The DeckUnits which comprise the deck.
   * @param config.faction The Faction the deck is being made of.
   * @param config.leader The leader for the deck.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @param config.name The name the deck should have to identify it.
   * @param config.userId The ID of the User adding the deck.
   * @returns The Deck that was created.
   * @throws {PresentableError} if deck with name already exists.
   * @throws {unknown} if unforseen problem adding deck.
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
        stats: GetUnitStats.fromDeckUnits(deckUnits),
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
