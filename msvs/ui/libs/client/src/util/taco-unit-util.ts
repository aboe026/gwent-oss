import {
  DeckUnitFragment,
  DeckUnitFragmentDoc,
  FieldUnitFragment,
  FieldUnitFragmentDoc,
  TacoUnitFragment,
  UnitFragment,
  UnitFragmentDoc,
  useFragment,
  WeatherUnitFragment,
  WeatherUnitFragmentDoc,
} from '@gwent/graphql-schema/apollo-typings'

/**
 * Converts a TacoUnitFragment to either a DeckUnitFragment, FieldUnitFragment or WeatherUnitFragment depending on its type.
 *
 * @param tacoUnit The TacoUnitFragment to convert to its underlying type.
 * @returns Either a DeckUnitFragment, FieldUnitFragment or WeatherUnitFragment depending on the type of the TacoUnitFragment.
 */
export function convertTacoUnit(
  tacoUnit: TacoUnitFragment
): DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment {
  if (tacoUnit.__typename === 'DeckUnit') {
    return tacoUnit as DeckUnitFragment
  } else if (tacoUnit.__typename === 'FieldUnit') {
    return tacoUnit as FieldUnitFragment
  } else {
    return tacoUnit as WeatherUnitFragment
  }
}

/**
 * Gets the Unit associated with the TacoUnit.
 *
 * @param tacoUnit The TacoUnit to get the unit associated with it.
 * @returns The Unit associated with the TacoUnit.
 */
export function getUnitFromTacoUnit(tacoUnit?: TacoUnitFragment | undefined | null): UnitFragment | undefined {
  let unit: UnitFragment | undefined = undefined
  if (tacoUnit) {
    if (tacoUnit.__typename === 'DeckUnit') {
      const deckUnit = useFragment(DeckUnitFragmentDoc, tacoUnit)
      unit = useFragment(UnitFragmentDoc, deckUnit.unit)
    } else if (tacoUnit.__typename === 'FieldUnit') {
      const fieldUnit = useFragment(FieldUnitFragmentDoc, tacoUnit)
      unit = useFragment(UnitFragmentDoc, fieldUnit.unit)
    } else if (tacoUnit.__typename === 'WeatherUnit') {
      const weatherUnit = useFragment(WeatherUnitFragmentDoc, tacoUnit)
      unit = useFragment(UnitFragmentDoc, weatherUnit.unit)
    }
  }

  return unit
}
