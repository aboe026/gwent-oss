import { Unit } from '@gwent/graphql-schema/resolver-typings'
import { DeckUnitFragment, useFragment, UnitFragmentDoc } from '@gwent/graphql-schema/apollo-typings'
import { DECK_MAX_SPECIALS, DECK_MIN_UNITS } from '@gwent/constants'
import randomizeOrder from './randomize-order'
import getRandomNumber from './get-random-number'

/**
 * A class to validate user-created Decks.
 */
export default class RandomizeDeckUnits {
  /**
   * Gets any errors in a user-created Deck with the given DeckUnits.
   *
   * @param config The configuration used to validate the deck.
   * @param config.faction The Faction the deck is for.
   * @param config.units The DeckUnits comprising the Deck.
   * @returns An array of potential violations the deck might have.
   */
  static fromUnits({ units }: { units: Unit[] }) {
    return RandomizeDeckUnits.randomize({
      units: units.map((unit) => {
        return {
          id: unit.id,
          special: unit.special,
        }
      }),
    })
  }

  /**
   * Gets any errors in a user-created Deck with the given DeckUnitFragments.
   *
   * @param config The configuration used to validate the deck.
   * @param config.faction The Faction the deck is for.
   * @param config.deckUnits The DeckUnitFragments comprising the Deck.
   * @returns An array of potential violations the deck might have.
   */
  static fromDeckUnitFragments({ units }: { units: DeckUnitFragment[] }) {
    return RandomizeDeckUnits.randomize({
      units: units.map((deckUnit) => {
        const unit = useFragment(UnitFragmentDoc, deckUnit.unit)
        return {
          factionKey: unit.faction.key,
          id: unit.id,
          special: unit.special,
        }
      }),
    })
  }

  /**
   * Gets any errors in a user-created Deck.
   *
   * @param config The configuration used to validate the deck.
   * @param config.deckUnits The Deck Units comprising the Deck.
   * @returns An array of potential violations the deck might have.
   */
  private static randomize({ units }: { units: UnitForValidation[] }): string[] {
    const randomUnits = randomizeOrder(units)
    const totalSpecials = getRandomNumber({
      min: 0,
      max: DECK_MAX_SPECIALS,
    })
    const totalNormals = getRandomNumber({
      min: DECK_MIN_UNITS - totalSpecials,
      max: randomUnits.length - totalSpecials,
    })

    let specials = 0
    let normals = 0
    const unitIds: string[] = []
    for (let i = 0; i < randomUnits.length && (specials < totalSpecials || normals < totalNormals); i++) {
      const unit = randomUnits[i]
      if (unit.special && specials < totalSpecials) {
        unitIds.push(unit.id)
        specials++
      } else if (!unit.special && normals < totalNormals) {
        unitIds.push(unit.id)
        normals++
      }
    }

    if (specials !== totalSpecials) {
      throw Error(`Not enough special units. Expected at least "${totalSpecials}", only "${specials}" found.`)
    }

    return unitIds
  }
}

export interface UnitForValidation {
  id: string
  special: boolean | undefined | null
}
