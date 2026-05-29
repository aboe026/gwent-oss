import { DeckUnitDbObject, GameDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * Removes units from each players combat rows for the current round of a game and adds them to their discards.
 *
 * @param game The game to move units from players combat rows to their discards for the current round.
 */
export default function clearBattlefieldUnits(game: GameDbObject) {
  for (const player of game.players) {
    const round = player.rounds[game.round - 1]
    player.deck.discard.push(
      ...round.close.units.map((fieldUnit) => {
        const deckUnit: DeckUnitDbObject = {
          artStyle: fieldUnit.artStyle,
          unit: fieldUnit.unit,
        }
        return deckUnit
      })
    )
    if (round.close.modifier) {
      player.deck.discard.push({
        artStyle: round.close.modifier.artStyle,
        unit: round.close.modifier.unit,
      })
    }
    player.deck.discard.push(
      ...round.ranged.units.map((fieldUnit) => {
        const deckUnit: DeckUnitDbObject = {
          artStyle: fieldUnit.artStyle,
          unit: fieldUnit.unit,
        }
        return deckUnit
      })
    )
    if (round.ranged.modifier) {
      player.deck.discard.push({
        artStyle: round.ranged.modifier.artStyle,
        unit: round.ranged.modifier.unit,
      })
    }
    player.deck.discard.push(
      ...round.siege.units.map((fieldUnit) => {
        const deckUnit: DeckUnitDbObject = {
          artStyle: fieldUnit.artStyle,
          unit: fieldUnit.unit,
        }
        return deckUnit
      })
    )
    if (round.siege.modifier) {
      player.deck.discard.push({
        artStyle: round.siege.modifier.artStyle,
        unit: round.siege.modifier.unit,
      })
    }
    for (const weather of round.weathers) {
      player.deck.discard.push({
        artStyle: weather.artStyle,
        unit: weather.unit,
      })
    }
  }
}
