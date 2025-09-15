import { DeckUnitFragmentFragment, GameUnitFragmentFragment } from '@gwent/graphql-schema/apollo-typings'

export default function isGameUnit(
  unit: DeckUnitFragmentFragment | GameUnitFragmentFragment
): unit is GameUnitFragmentFragment {
  const gameUnit = unit as GameUnitFragmentFragment
  return gameUnit.effectiveStrength !== undefined || gameUnit.effects !== undefined || gameUnit.row !== undefined
}
