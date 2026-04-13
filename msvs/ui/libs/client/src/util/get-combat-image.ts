import {
  Combat,
  DeckUnitFragment,
  FieldUnitFragment,
  UnitFragmentDoc,
  useFragment,
  WeatherUnitFragment,
} from '@gwent/graphql-schema/apollo-typings'

/**
 * Get the path to the combat image for a GameUnit.
 *
 * @param deckUnit The GameUnit to get the combat image for.
 * @returns The path to the image representing the combat for the GameUnit.
 */
export default function getCombatImage(
  deckUnit: DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment
): string | undefined {
  const unit = useFragment(UnitFragmentDoc, deckUnit.unit)
  if (!unit.special) {
    if (unit.combats?.length === 1) {
      return `images/combats/${unit.combats[0].toLowerCase()}.png`
    } else if (
      unit.combats?.length === 2 &&
      unit.combats?.includes(Combat.Close) &&
      unit.combats?.includes(Combat.Ranged)
    ) {
      return 'images/combats/agile.png'
    }
  }
}
