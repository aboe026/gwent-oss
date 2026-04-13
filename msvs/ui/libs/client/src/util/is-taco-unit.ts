import {
  DeckUnitFragment,
  FieldUnitFragment,
  TacoUnitFragment,
  WeatherUnitFragment,
} from '@gwent/graphql-schema/apollo-typings'

/**
 * Whether an object is a TacoUnitFragment or not.
 *
 * @param unit The unit to check whether or not it is a TacoUnitFragment.
 * @returns True if the unit is a TacoUnitFragment, false if it is not.
 */
export default function isTacoUnit(
  unit: TacoUnitFragment | DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment | undefined
): unit is TacoUnitFragment {
  const maskedUnit = unit as DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment | undefined
  return !!(maskedUnit && maskedUnit.unit)
}
