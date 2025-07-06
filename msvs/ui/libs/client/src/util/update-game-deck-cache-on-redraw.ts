import { DeckUnit, GameDeckQuery } from '@gwent/graphql-schema/apollo-typings'

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
  from: DeckUnit
  to: DeckUnit
}) {
  if (previous?.gameDeck) {
    return {
      gameDeck: {
        ...previous.gameDeck,
        hand: [
          ...(previous.gameDeck?.hand || []).filter(
            (deckUnit) => deckUnit.unit.id !== from.unit.id && deckUnit.unit.id !== to.unit.id
          ),
          to,
        ],
        undrawn: [
          ...(previous.gameDeck?.undrawn || []).filter(
            (deckUnit) => deckUnit.unit.id !== to.unit.id && deckUnit.unit.id !== from.unit.id
          ),
          from,
        ],
        redraws: [
          ...(previous.gameDeck?.redraws || []).filter(
            (deckUnit) => deckUnit.from.unit.id !== from.unit.id && deckUnit.to.unit.id !== to.unit.id
          ),
          {
            from,
            to,
          },
        ],
      },
    }
  }
}
