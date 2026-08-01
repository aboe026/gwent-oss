import { DeckUnitDbObject, GameDbObject, PlayerCombatRowDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * A class to discard players battlefield units for the current game round.
 */
export default class DiscardRoundUnits {
  /**
   * Moves all units on the battlefield (Field - including modifiers - and Weather) to the discard pile of each player for the current game round.
   *
   * @param game The game to move units from players combat rows to their discards for the current round.
   */
  static discardRoundUnits(game: GameDbObject) {
    for (const player of game.players) {
      const round = player.rounds[game.round - 1]

      player.deck.discard.push(...DiscardRoundUnits.getRowFieldUnitsAsDeckUnits(round.close))
      player.deck.discard.push(...DiscardRoundUnits.getRowFieldUnitsAsDeckUnits(round.ranged))
      player.deck.discard.push(...DiscardRoundUnits.getRowFieldUnitsAsDeckUnits(round.siege))

      for (const weather of round.weathers) {
        player.deck.discard.push({
          artStyle: weather.artStyle,
          unit: weather.unit,
        })
      }
    }
  }

  /**
   * Gets all FieldUnits in a combat row (including modifiers) and returns them as DeckUnits.
   *
   * @param row The combat row to get FieldUnits as DeckUnits for.
   * @returns The FieldUnits for a combat row as DeckUnits.
   */
  private static getRowFieldUnitsAsDeckUnits(row: PlayerCombatRowDbObject): DeckUnitDbObject[] {
    const discards: DeckUnitDbObject[] = row.units.map((fieldUnit) => {
      return {
        artStyle: fieldUnit.artStyle,
        unit: fieldUnit.unit,
      }
    })

    if (row.modifier) {
      discards.push({
        artStyle: row.modifier.artStyle,
        unit: row.modifier.unit,
      })
    }

    return discards
  }
}
