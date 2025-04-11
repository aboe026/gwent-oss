import { DeckUnit, GameDeckQuery } from '@gwent/graphql-schema/apollo-typings'

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
