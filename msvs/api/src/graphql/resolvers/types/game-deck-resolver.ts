import { getLogger } from 'log4js'

import DeckResolver from './deck-resolver'
import DeckUnitResolver from './deck-unit-resolver'
import { GameDeck } from '@gwent/graphql-schema/resolver-typings'
import { GameDeckDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * A class to convert GameDeck database objects to their GraphQL equivalent.
 */
export default class GameDeckResolver {
  private static logger = getLogger('GameDeckResolver')

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
        ...gameDeck.discard,
        ...gameDeck.hand,
        ...gameDeck.redraws.map((redraw) => redraw.from),
        ...gameDeck.redraws.map((redraw) => redraw.to),
        ...gameDeck.undrawn,
      ],
    })

    return {
      discard: gameDeck.discard.map((deckUnit) => {
        const resolvedDeckUnit = deckUnits.find(
          (potentialResolvedDeckUnit) => potentialResolvedDeckUnit.unit.id === deckUnit.unit.toString()
        )
        if (!resolvedDeckUnit) {
          const message = `Could not resolve discarded DeckUnit "${deckUnit.unit}"`
          GameDeckResolver.logger.error(message)
          throw Error(message)
        }
        return resolvedDeckUnit
      }),
      from:
        gameDeck.from &&
        (await DeckResolver.fromObject({
          deck: gameDeck.from,
        })),
      hand: gameDeck.hand.map((deckUnit) => {
        const resolvedDeckUnit = deckUnits.find(
          (potentialResolvedDeckUnit) => potentialResolvedDeckUnit.unit.id === deckUnit.unit.toString()
        )
        if (!resolvedDeckUnit) {
          const message = `Could not resolve hand DeckUnit "${deckUnit.unit}"`
          GameDeckResolver.logger.error(message)
          throw Error(message)
        }
        return resolvedDeckUnit
      }),
      redraws: gameDeck.redraws.map((redraw) => {
        const from = deckUnits.find((resolvedDeckUnit) => resolvedDeckUnit.unit.id === redraw.from.unit.toString())
        if (!from) {
          const message = `Could not resolve from redraw DeckUnit "${redraw.from.unit}"`
          GameDeckResolver.logger.error(message)
          throw Error(message)
        }
        const to = deckUnits.find((resolvedDeckUnit) => resolvedDeckUnit.unit.id === redraw.to.unit.toString())
        if (!to) {
          const message = `Could not resolve to redraw DeckUnit "${redraw.to.unit}"`
          GameDeckResolver.logger.error(message)
          throw Error(message)
        }
        return {
          from,
          to,
        }
      }),
      undrawn: gameDeck.undrawn.map((deckUnit) => {
        const resolvedDeckUnit = deckUnits.find(
          (potentialResolvedDeckUnit) => potentialResolvedDeckUnit.unit.id === deckUnit.unit.toString()
        )
        if (!resolvedDeckUnit) {
          const message = `Could not resolve undrawn DeckUnit "${deckUnit.unit}"`
          GameDeckResolver.logger.error(message)
          throw Error(message)
        }
        return resolvedDeckUnit
      }),
    }
  }
}
