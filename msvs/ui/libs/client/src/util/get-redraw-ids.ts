import { FragmentType } from '@apollo/client'

import {
  CardUnitFragmentDoc,
  DeckUnitFragment,
  DeckUnitFragmentDoc,
  GameDeckFragment,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'

export default function getRedrawIds({ gameDeck }: { gameDeck: GameDeckFragment | null | undefined }): string[] {
  const redrawIds: string[] = []

  const redrawUnits: FragmentType<DeckUnitFragment>[] = []
  if (gameDeck) {
    for (const redraw of gameDeck.redraws) {
      redrawUnits.push(redraw.from)
      redrawUnits.push(redraw.to)
    }
  }
  for (const redrawUnit of redrawUnits) {
    const deckUnit = useFragment(DeckUnitFragmentDoc, redrawUnit)
    const unit = useFragment(CardUnitFragmentDoc, deckUnit.unit)
    if (!redrawIds.includes(unit.id)) {
      redrawIds.push(unit.id)
    }
  }

  return redrawIds
}
