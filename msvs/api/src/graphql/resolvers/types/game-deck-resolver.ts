import DeckResolver from './deck-resolver'
import { DeckUnit, GameDeck, GameUnit } from '@gwent/graphql-schema/resolver-typings'
import DeckUnitResolver from './deck-unit-resolver'
import { GameDeckDbObject } from '@gwent/graphql-schema/database-typings'
import GameUnitResolver from './game-unit-resolver'

/**
 * A class to convert GameDeck database objects to their GraphQL equivalent.
 */
export default class GameDeckResolver {
  /**
   * Converts a single GameDeck database object to a single GameDeck GraphQL object.
   *
   * @param config The configuration used to convert the GameDeck.
   * @param config.gameDeck The GameDeck to convert.
   * @returns The resolved GameDeck object matching its GraphQL schema definition.
   */
  static async fromObject({ gameDeck }: { gameDeck: GameDeckDbObject }): Promise<GameDeck> {
    const deckUnits = await DeckUnitResolver.fromArray({
      deckUnits: [
        ...gameDeck.hand,
        ...gameDeck.redraws.map((redraw) => redraw.from),
        ...gameDeck.redraws.map((redraw) => redraw.to),
        ...gameDeck.undrawn,
      ],
    })
    const gameUnits = await GameUnitResolver.fromArray({
      gameUnits: gameDeck.discard,
    })

    // TODO: do not cast "as" check if exists and throw error if not
    return {
      discard: gameDeck.discard.map(
        (gameUnit) =>
          gameUnits.find((resolvedDeckUnit) => resolvedDeckUnit.unit.id === gameUnit.unit.toString()) as GameUnit
      ),
      from:
        gameDeck.from &&
        (await DeckResolver.fromObject({
          deck: gameDeck.from,
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
