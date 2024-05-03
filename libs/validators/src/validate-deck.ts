import { DeckUnit, FactionKey } from '@gwent/graphql-schema/resolver-typings'
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

  if (specials > 10) {
    errors.push(`Invalid number of special units at "${specials}", maximum is "10".`)
  }
  if (deckUnits.length < 22) {
    errors.push(`Invalid number of units at "${deckUnits.length}", minimum is "22".`)
  }

  return errors
}
