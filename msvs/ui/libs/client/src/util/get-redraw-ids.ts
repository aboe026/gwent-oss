import { FragmentType } from '@apollo/client'

import {
  CardUnitFragmentFragmentDoc,
  DeckUnitFragmentFragment,
  DeckUnitFragmentFragmentDoc,
  GameDeckFragmentFragment,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'

export default function getRedrawIds({
  gameDeck,
}: {
  gameDeck: GameDeckFragmentFragment | null | undefined
}): string[] {
  const redrawIds: string[] = []

  const redrawUnits: FragmentType<DeckUnitFragmentFragment>[] = []
  if (gameDeck) {
    for (const redraw of gameDeck.redraws) {
      redrawUnits.push(redraw.from)
      redrawUnits.push(redraw.to)
    }
  }
  for (const redrawUnit of redrawUnits) {
    const deckUnit = useFragment(DeckUnitFragmentFragmentDoc, redrawUnit)
    const unit = useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit)
    if (!redrawIds.includes(unit.id)) {
      redrawIds.push(unit.id)
    }
  }

  return redrawIds
}
