import { Unit } from '@gwent/graphql-schema/resolver-typings'
import { DeckUnitFragment, useFragment, UnitFragmentDoc } from '@gwent/graphql-schema/apollo-typings'
import { DECK_MAX_SPECIALS, DECK_MIN_UNITS } from '@gwent/constants'
import randomizeOrder from './randomize-order'
import getRandomNumber from './get-random-number'

/**
 * A class to generate a random set of units for a Deck.
 */
export default class RandomizeDeckUnits {
  /**
   * Generates an array of unit IDs for creating a Deck.
   *
   * @param config The configuration used to generate the random Deck Units.
   * @param config.units The Units that can make up the Deck.
   * @returns An array of Unit IDs which can be used to create a Deck.
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
   * Generates an array of unit IDs for creating a Deck.
   *
   * @param config The configuration used to generate the random Deck Units.
   * @param config.units The Units that can make up the Deck.
   * @returns An array of Unit IDs which can be used to create a Deck.
   */
  static fromDeckUnitFragments({ units }: { units: DeckUnitFragment[] }) {
    return RandomizeDeckUnits.randomize({
      units: units.map((deckUnit) => {
        const unit = useFragment(UnitFragmentDoc, deckUnit.unit)
        return {
          id: unit.id,
          special: unit.special,
        }
      }),
    })
  }

  /**
   * Generates an array of unit IDs for creating a Deck.
   *
   * @param config The configuration used to generate the random Deck Units.
   * @param config.units The Units that can make up the Deck.
   * @returns An array of Unit IDs which can be used to create a Deck.
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
