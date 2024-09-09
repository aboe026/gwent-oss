import { GameDeckDbObject } from '@gwent/graphql-schema/database-typings'
import { DeckUnit, GameDeck } from '@gwent/graphql-schema/resolver-typings'
import DeckResolver from './deck-resolver'
import DeckUnitResolver from './deck-unit-resolver'

export default class GameDeckResolver {
  static async fromObject({
    gameDeck,
    neutralDeckStats,
    neutralLeaderStats,
    neutralUnitStats,
  }: {
    gameDeck: GameDeckDbObject
    neutralDeckStats?: boolean
    neutralLeaderStats?: boolean
    neutralUnitStats?: boolean
  }): Promise<GameDeck> {
    const deckUnits = await DeckUnitResolver.fromArray({
      deckUnits: [
        ...gameDeck.discard,
        ...gameDeck.hand,
        ...gameDeck.redraws.map((redraw) => redraw.from),
        ...gameDeck.redraws.map((redraw) => redraw.to),
        ...gameDeck.undrawn,
      ],
      neutralStats: neutralUnitStats,
    })

    return {
      discard: gameDeck.discard.map(
        (deckUnit) =>
          deckUnits.find((resolvedDeckUnit) => resolvedDeckUnit.unit.id === deckUnit.unit.toString()) as DeckUnit
      ),
      from:
        gameDeck.from &&
        (await DeckResolver.fromObject({
          deck: gameDeck.from,
          neutralDeckStats,
          neutralLeaderStats,
          neutralUnitStats,
        })),
      hand: gameDeck.hand.map(
        (deckUnit) =>
          deckUnits.find((resolvedDeckUnit) => resolvedDeckUnit.unit.id === deckUnit.unit.toString()) as DeckUnit
      ),
      redraws: gameDeck.redraws.map((redraw) => {
        return {
          from: deckUnits.find(
            (resolvedDeckUnit) => resolvedDeckUnit.unit.id === redraw.from.unit.toString()
          ) as DeckUnit,
          to: deckUnits.find((resolvedDeckUnit) => resolvedDeckUnit.unit.id === redraw.to.unit.toString()) as DeckUnit,
        }
      }),
      undrawn: gameDeck.undrawn.map(
        (deckUnit) =>
          deckUnits.find((resolvedDeckUnit) => resolvedDeckUnit.unit.id === deckUnit.unit.toString()) as DeckUnit
      ),
    }
  }
}
