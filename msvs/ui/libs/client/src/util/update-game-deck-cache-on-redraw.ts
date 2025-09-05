import {
  CardUnitFragmentFragmentDoc,
  DeckUnitFragmentFragment,
  DeckUnitFragmentFragmentDoc,
  GameDeckFragmentFragmentDoc,
  GameDeckQuery,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'

/**
 * Updates the Apollo cache for GameDeck when redraw made.
 *
 * @param config The configuration used to update the cache.
 * @param config.previous The previous query to update.
 * @param config.from The DeckUnit that was chosen to redraw for a new, random unit.
 * @param config.to The DeckUnit that was randomly chosen to replace the from DeckUnit.
 * @returns The updated GameDeck with redraw changes reflected.
 */
export default function updateGameDeckCacheOnRedraw({
  previous,
  from,
  to,
}: {
  previous: GameDeckQuery | null
  from: DeckUnitFragmentFragment
  to: DeckUnitFragmentFragment
}) {
  if (previous?.gameDeck) {
    const gameDeck = useFragment(GameDeckFragmentFragmentDoc, previous.gameDeck)
    const fromUnit = useFragment(CardUnitFragmentFragmentDoc, from.unit)
    const toUnit = useFragment(CardUnitFragmentFragmentDoc, to.unit)
    return {
      gameDeck: {
        ...previous.gameDeck,
        hand: [
          ...(gameDeck?.hand || []).filter(
            (deckUnit) =>
              ![fromUnit.id, toUnit.id].includes(
                useFragment(CardUnitFragmentFragmentDoc, useFragment(DeckUnitFragmentFragmentDoc, deckUnit).unit).id
              )
          ),
          to,
        ],
        undrawn: [
          ...(gameDeck?.undrawn || []).filter(
            (deckUnit) =>
              ![fromUnit.id, toUnit.id].includes(
                useFragment(CardUnitFragmentFragmentDoc, useFragment(DeckUnitFragmentFragmentDoc, deckUnit).unit).id
              )
          ),
          from,
        ],
        redraws: [
          ...(gameDeck?.redraws || []).filter((deckUnit) => {
            const existingFromUnit = useFragment(
              CardUnitFragmentFragmentDoc,
              useFragment(DeckUnitFragmentFragmentDoc, deckUnit.from).unit
            )
            const existingToUnit = useFragment(
              CardUnitFragmentFragmentDoc,
              useFragment(DeckUnitFragmentFragmentDoc, deckUnit.to).unit
            )
            return existingFromUnit.id !== fromUnit.id && existingToUnit.id !== toUnit.id
          }),
          {
            from,
            to,
          },
        ],
      },
    }
  }
}
