import {
  DeckUnitFragment,
  DeckUnitFragmentDoc,
  FieldUnitFragment,
  FieldUnitFragmentDoc,
  GameUnitFragment,
  UnitFragment,
  UnitFragmentDoc,
  useFragment,
  WeatherUnitFragment,
  WeatherUnitFragmentDoc,
} from '@gwent-oss/graphql-schema/apollo-typings'

/**
 * Converts a GameUnitFragment to either a DeckUnitFragment, FieldUnitFragment or WeatherUnitFragment depending on its type.
 *
 * @param gameUnit The GameUnitFragment to convert to its underlying type.
 * @returns Either a DeckUnitFragment, FieldUnitFragment or WeatherUnitFragment depending on the type of the GameUnitFragment.
 */
export function convertGameUnit(
  gameUnit: GameUnitFragment
): DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment {
  if (gameUnit.__typename === 'DeckUnit') {
    return gameUnit as DeckUnitFragment
  } else if (gameUnit.__typename === 'FieldUnit') {
    return gameUnit as FieldUnitFragment
  } else {
    return gameUnit as WeatherUnitFragment
  }
}

/**
 * Gets the Unit associated with the GameUnit.
 *
 * @param gameUnit The GameUnit to get the unit associated with it.
 * @returns The Unit associated with the GameUnit.
 */
export function getUnitFromGameUnit(gameUnit?: GameUnitFragment | undefined | null): UnitFragment | undefined {
  let unit: UnitFragment | undefined = undefined
  if (gameUnit) {
    if (gameUnit.__typename === 'DeckUnit') {
      const deckUnit = useFragment(DeckUnitFragmentDoc, gameUnit)
      unit = useFragment(UnitFragmentDoc, deckUnit.unit)
    } else if (gameUnit.__typename === 'FieldUnit') {
      const fieldUnit = useFragment(FieldUnitFragmentDoc, gameUnit)
      unit = useFragment(UnitFragmentDoc, fieldUnit.unit)
    } else if (gameUnit.__typename === 'WeatherUnit') {
      const weatherUnit = useFragment(WeatherUnitFragmentDoc, gameUnit)
      unit = useFragment(UnitFragmentDoc, weatherUnit.unit)
    }
  }

  return unit
}
