import { DeckUnitFragment, GameUnitFragment } from '@gwent/graphql-schema/apollo-typings'

/**
 * Whether an object is a GameUnitFragment or a DeckUnitFragment.
 *
 * @param unit The unit to check whether or not it is a GameUnitFragment.
 * @returns True if the unit is a GameUnitFragment, false if it is a DeckUnitFragment.
 */
export default function isGameUnit(unit: DeckUnitFragment | GameUnitFragment): unit is GameUnitFragment {
  const gameUnit = unit as GameUnitFragment
  return gameUnit.effectiveStrength !== undefined || gameUnit.effects !== undefined || gameUnit.row !== undefined
}
