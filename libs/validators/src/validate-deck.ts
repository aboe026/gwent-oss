import {
  CardUnitFragmentFragmentDoc,
  DeckUnitFragmentFragment,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'
import { DeckUnit, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import { DECK_MAX_SPECIALS, DECK_MIN_UNITS } from '@gwent/constants'
import validatePositiveInteger from './validate-positive-integer'

export default class ValidateDeck {
  static fromDeckUnits({ faction, deckUnits }: { faction: FactionKey; deckUnits: DeckUnit[] }) {
    return ValidateDeck.validate({
      faction,
      deckUnits: deckUnits.map((deckUnit) => {
        return {
          artStyle: deckUnit.artStyle,
          factionKey: deckUnit.unit.faction.key,
          id: deckUnit.unit.id,
          images: deckUnit.unit.images.length,
          special: deckUnit.unit.special,
        }
      }),
    })
  }

  static fromDeckUnitFragments({ faction, deckUnits }: { faction: FactionKey; deckUnits: DeckUnitFragmentFragment[] }) {
    return ValidateDeck.validate({
      faction,
      deckUnits: deckUnits.map((deckUnit) => {
        const unit = useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit)
        return {
          artStyle: deckUnit.artStyle,
          factionKey: unit.faction.key,
          id: unit.id,
          images: unit.images.length,
          special: unit.special,
        }
      }),
    })
  }

  private static validate({
    faction,
    deckUnits,
  }: {
    faction: FactionKey
    deckUnits: {
      factionKey: FactionKey
      id: string
      special: boolean | undefined | null
      artStyle: number | undefined | null
      images: number
    }[]
  }): string[] {
    const errors: string[] = []

    let specials = 0
    for (const deckUnit of deckUnits) {
      if (deckUnit.factionKey !== faction && deckUnit.factionKey !== FactionKey.Neutral) {
        errors.push(
          `Invalid faction "${deckUnit.factionKey}" for unit "${deckUnit.id}", must be either "${faction}" or "${FactionKey.Neutral}".`
        )
      }
      if (deckUnit.special) {
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
            `Invalid artStyle "${deckUnit.artStyle}" for unit "${deckUnit.id}", must be positive integer greater than zero.`
          )
        }
        if (deckUnit.artStyle > deckUnit.images) {
          errors.push(
            `Invalid artStyle "${deckUnit.artStyle}" for unit "${deckUnit.id}", only "${deckUnit.images}" art styles available for unit.`
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
}
