import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import GameUnitUtil from '../util/game-unit-util'

/**
 * Removes units from each players combat rows for the current round of a game and adds them to their discards.
 *
 * @param game The game to move units from players combat rows to their discards for the current round.
 */
export default function clearBattlefieldUnits(game: GameDbObject) {
  for (const player of game.players) {
    const round = player.rounds[game.round - 1]
    player.deck.discard.push(
      ...round.close.units.map((fieldUnit) => GameUnitUtil.convertFieldUnitToGameUnit(fieldUnit))
    )
    if (round.close.modifier) {
      player.deck.discard.push(GameUnitUtil.convertFieldUnitToGameUnit(round.close.modifier))
    }
    player.deck.discard.push(
      ...round.ranged.units.map((fieldUnit) => GameUnitUtil.convertFieldUnitToGameUnit(fieldUnit))
    )
    if (round.ranged.modifier) {
      player.deck.discard.push(GameUnitUtil.convertFieldUnitToGameUnit(round.ranged.modifier))
    }
    player.deck.discard.push(
      ...round.siege.units.map((fieldUnit) => GameUnitUtil.convertFieldUnitToGameUnit(fieldUnit))
    )
    if (round.siege.modifier) {
      player.deck.discard.push(GameUnitUtil.convertFieldUnitToGameUnit(round.siege.modifier))
    }
    for (const weather of round.weathers) {
      player.deck.discard.push(GameUnitUtil.convertWeatherUnitToGameUnit(weather))
    }
  }
}
