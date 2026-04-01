import {
  DeckUnitFragment,
  DeckUnitFragmentDoc,
  GameUnitFragment,
  GameUnitFragmentDoc,
  TacoUnitFragment,
  UnitFragment,
  UnitFragmentDoc,
  useFragment,
  WeatherUnitFragment,
  WeatherUnitFragmentDoc,
} from '@gwent/graphql-schema/apollo-typings'

export function convertTacoUnit(tacoUnit: TacoUnitFragment): DeckUnitFragment | GameUnitFragment | WeatherUnitFragment {
  if (tacoUnit.__typename === 'DeckUnit') {
    return tacoUnit as DeckUnitFragment
  } else if (tacoUnit.__typename === 'GameUnit') {
    return tacoUnit as GameUnitFragment
  } else {
    return tacoUnit as WeatherUnitFragment
  }
}

// TODO: also accept undefined and return undefined?
export function getUnitFromTacoUnit(tacoUnit: TacoUnitFragment): UnitFragment {
  let unit: UnitFragment | undefined = undefined
  if (tacoUnit.__typename === 'DeckUnit') {
    const deckUnit = useFragment(DeckUnitFragmentDoc, tacoUnit)
    unit = useFragment(UnitFragmentDoc, deckUnit.unit)
  } else if (tacoUnit.__typename === 'GameUnit') {
    const gameUnit = useFragment(GameUnitFragmentDoc, tacoUnit)
    unit = useFragment(UnitFragmentDoc, gameUnit.unit)
  } else if (tacoUnit.__typename === 'WeatherUnit') {
    const weatherUnit = useFragment(WeatherUnitFragmentDoc, tacoUnit)
    unit = useFragment(UnitFragmentDoc, weatherUnit.unit)
  }

  if (!unit) {
    throw Error(`Could not convert TacoUnitFragment "${JSON.stringify(tacoUnit)}" to UnitFragment`)
  }

  return unit
}
