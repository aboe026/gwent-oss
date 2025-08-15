import { DeckUnit, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import { DECK_MAX_SPECIALS, DECK_MIN_UNITS } from '@gwent/constants'
import validatePositiveInteger from './validate-positive-integer'

/**
 * Validates whether or not a deck contains errors.
 *
 * @param options The options for validating the deck.
 * @param options.faction The faction the deck is being created for.
 * @param options.deckUnits The Units apart of the Deck.
 * @returns Any errors the deck might have.
 */
export default function validateDeck({ faction, deckUnits }: { faction: FactionKey; deckUnits: DeckUnit[] }): string[] {
  const errors: string[] = []

  let specials = 0
  for (const deckUnit of deckUnits) {
    if (deckUnit.unit.faction.key !== faction && deckUnit.unit.faction.key !== FactionKey.Neutral) {
      errors.push(
        `Invalid faction "${deckUnit.unit.faction.key}" for unit "${deckUnit.unit.id}", must be either "${faction}" or "${FactionKey.Neutral}".`
      )
    }
    if (deckUnit.unit.special) {
      specials++
    }
    if (deckUnit.artStyle !== undefined && deckUnit.artStyle !== null) {
      try {
        validatePositiveInteger(deckUnit.artStyle, {
          allowZero: false,
        })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        errors.push(
          `Invalid artStyle "${deckUnit.artStyle}" for unit "${deckUnit.unit.id}", must be positive integer greater than zero.`
        )
      }
      if (deckUnit.artStyle > deckUnit.unit.images.length) {
        errors.push(
          `Invalid artStyle "${deckUnit.artStyle}" for unit "${deckUnit.unit.id}", only "${deckUnit.unit.images.length}" art styles available for unit.`
        )
      }
    }
  }

  if (specials > DECK_MAX_SPECIALS) {
    errors.push(`Invalid number of special units at "${specials}", maximum is "${DECK_MAX_SPECIALS}".`)
  }
  if (deckUnits.length < DECK_MIN_UNITS) {
    errors.push(`Invalid number of units at "${deckUnits.length}", minimum is "${DECK_MIN_UNITS}".`)
  }

  return errors
}
