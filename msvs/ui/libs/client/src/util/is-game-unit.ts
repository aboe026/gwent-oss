import { DeckUnitFragment, GameUnitFragment } from '@gwent/graphql-schema/apollo-typings'

export default function isGameUnit(unit: DeckUnitFragment | GameUnitFragment): unit is GameUnitFragment {
  const gameUnit = unit as GameUnitFragment
  return gameUnit.effectiveStrength !== undefined || gameUnit.effects !== undefined || gameUnit.row !== undefined
}
