import {
  DeckUnitFragment,
  FieldUnitFragment,
  GameUnitFragment,
  WeatherUnitFragment,
} from '@gwent/graphql-schema/apollo-typings'

/**
 * Whether an object is a GameUnitFragment or not.
 *
 * @param unit The unit to check whether or not it is a GameUnitFragment.
 * @returns True if the unit is a GameUnitFragment, false if it is not.
 */
export default function isGameUnit(
  unit: GameUnitFragment | DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment | undefined
): unit is GameUnitFragment {
  const maskedUnit = unit as DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment | undefined
  return !!(maskedUnit && maskedUnit.unit)
}
