import {
  DeckUnitFragment,
  GameUnitFragment,
  TacoUnitFragment,
  WeatherUnitFragment,
} from '@gwent/graphql-schema/apollo-typings'

/**
 * Whether an object is a GameUnitFragment or a DeckUnitFragment.
 *
 * @param unit The unit to check whether or not it is a GameUnitFragment.
 * @returns True if the unit is a GameUnitFragment, false if it is a DeckUnitFragment.
 */
export default function isTacoUnit(
  unit: TacoUnitFragment | DeckUnitFragment | GameUnitFragment | WeatherUnitFragment | undefined
): unit is TacoUnitFragment {
  const maskedUnit = unit as DeckUnitFragment | GameUnitFragment | WeatherUnitFragment | undefined
  return !!(maskedUnit && maskedUnit.unit)
}
