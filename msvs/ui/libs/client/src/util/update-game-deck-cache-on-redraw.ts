import {
  DeckUnitFragment,
  UnitEffectFragmentDoc,
  UnitFragmentDoc,
  useFragment,
} from '@gwent-oss/graphql-schema/apollo-typings'
import { GameDeckQuery as GameDeckQueryRaw } from '@gwent-oss/graphql-schema/apollo-raw-typings'

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
  previous: GameDeckQueryRaw
  from: DeckUnitFragment
  to: DeckUnitFragment
}): GameDeckQueryRaw {
  const fromUnit = useFragment(UnitFragmentDoc, from.unit)
  const toUnit = useFragment(UnitFragmentDoc, to.unit)
  return {
    ...previous,
    gameDeck: {
      ...previous.gameDeck,
      discard: previous.gameDeck?.discard || [],
      hand: [
        ...(previous.gameDeck?.hand || []).filter((deckUnit) => ![fromUnit.id, toUnit.id].includes(deckUnit.unit.id)),
        {
          ...to,
          unit: {
            ...toUnit,
            effects: toUnit.effects?.map((effect) => useFragment(UnitEffectFragmentDoc, effect)),
          },
        },
      ],
      undrawn: [
        ...(previous.gameDeck?.undrawn || []).filter(
          (deckUnit) => ![fromUnit.id, toUnit.id].includes(deckUnit.unit.id)
        ),
        {
          ...from,
          unit: {
            ...fromUnit,
            effects: fromUnit.effects?.map((effect) => useFragment(UnitEffectFragmentDoc, effect)),
          },
        },
      ],
      redraws: [
        ...(previous.gameDeck?.redraws || []).filter((deckUnit) => {
          return deckUnit.from.unit.id !== fromUnit.id && deckUnit.to.unit.id !== toUnit.id
        }),
        {
          from: {
            ...from,
            unit: {
              ...fromUnit,
              effects: fromUnit.effects?.map((effect) => useFragment(UnitEffectFragmentDoc, effect)),
            },
          },
          to: {
            ...to,
            unit: {
              ...toUnit,
              effects: toUnit.effects?.map((effect) => useFragment(UnitEffectFragmentDoc, effect)),
            },
          },
        },
      ],
    },
  }
}
