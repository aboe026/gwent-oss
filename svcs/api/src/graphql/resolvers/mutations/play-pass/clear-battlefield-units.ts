import { GameDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * Removes units from each players combat rows for the current round of a game and adds them to their discards.
 *
 * @param game The game to move units from players combat rows to their discards for the current round.
 */
export default function clearBattlefieldUnits(game: GameDbObject) {
  for (const player of game.players) {
    const round = player.rounds[game.round - 1]
    player.deck.discard.push(...round.close.units)
    player.deck.discard.push(...round.ranged.units)
    player.deck.discard.push(...round.siege.units)
  }
}
