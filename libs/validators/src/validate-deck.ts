import { DeckCard, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import validatePositiveInteger from './validate-positive-integer'

/**
 * Validates whether or not a deck contains errors.
 *
 * @param options The options for validating the deck.
 * @param options.faction The faction the deck is being created for.
 * @param options.cards The cards the deck consists of.
 * @returns Any errors the deck might have.
 */
export default function validateDeck({ faction, cards }: { faction: FactionKey; cards: DeckCard[] }): string[] {
  const errors: string[] = []

  let specials = 0
  for (const card of cards) {
    if (card.unit.faction.key !== faction && card.unit.faction.key !== FactionKey.Neutral) {
      errors.push(
        `Invalid faction "${card.unit.faction.key}" for card "${card.unit.id}", must be either "${faction}" or "${FactionKey.Neutral}".`
      )
    }
    if (card.unit.special) {
      specials++
    }
    if (card.artStyle !== undefined && card.artStyle !== null) {
      try {
        validatePositiveInteger(card.artStyle, {
          allowZero: false,
        })
      } catch (err) {
        errors.push(
          `Invalid artStyle "${card.artStyle}" for card "${card.unit.id}", must be positive integer greater than zero.`
        )
      }
      if (card.artStyle > card.unit.images.length) {
        errors.push(
          `Invalid artStyle "${card.artStyle}" for card "${card.unit.id}", only "${card.unit.images.length}" art styles available for card.`
        )
      }
    }
  }

  if (specials > 10) {
    errors.push(`Invalid number of special cards at "${specials}", maximum is "10".`)
  }
  if (cards.length < 22) {
    errors.push(`Invalid number of cards at "${cards.length}", minimum is "22".`)
  }

  return errors
}
