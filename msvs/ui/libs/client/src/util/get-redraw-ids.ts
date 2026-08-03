import {
  DeckUnitFragmentDoc,
  FragmentType,
  GameDeckFragment,
  UnitFragmentDoc,
  useFragment,
} from '@gwent-oss/graphql-schema/apollo-typings'

/**
 * Get the IDs of the units involved in redraws.
 *
 * @param config The configuration used to get the redraw unit IDs.
 * @param config.gameDeck The GameDeckFragment containing the Redraw objects.
 * @returns The IDs of the units involved in the redraws (both to and from).
 */
export default function getRedrawIds({ gameDeck }: { gameDeck: GameDeckFragment | null | undefined }): string[] {
  const redrawIds: string[] = []

  const redrawUnits: FragmentType<typeof DeckUnitFragmentDoc>[] = []
  if (gameDeck) {
    for (const redraw of gameDeck.redraws) {
      redrawUnits.push(redraw.from)
      redrawUnits.push(redraw.to)
    }
  }
  for (const redrawUnit of redrawUnits) {
    const deckUnit = useFragment(DeckUnitFragmentDoc, redrawUnit)
    const unit = useFragment(UnitFragmentDoc, deckUnit.unit)
    if (!redrawIds.includes(unit.id)) {
      redrawIds.push(unit.id)
    }
  }

  return redrawIds
}
