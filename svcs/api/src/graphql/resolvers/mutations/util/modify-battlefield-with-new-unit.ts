import { Combat } from '@gwent/graphql-schema/resolver-typings'
import { DeckUnitDbObject, GameDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * Modifies the battlefield of the current round in a game due to the deployment of a new unit. Other units on or off the battlefield may be impacted by unit effects.
 *
 * @param config The configuration used to determine the impact the new unit has on the battlefield.
 * @param config.game The game whose battlefield should have the units deployment applied to it.
 * @param config.deckUnit The new unit being deployed to the battlefield.
 * @param config.combat The combat row the unit is being deployed to.
 */
export default function modifyBattlefieldWithNewUnit({
  game,
  deckUnit,
  combat,
}: {
  game: GameDbObject
  deckUnit: DeckUnitDbObject
  combat: Combat
}) {
  for (const player of game.players) {
    if (player.user.toString() === game.turn?.toString()) {
      player.deck.hand = player.deck.hand.filter((handUnit) => handUnit.unit.toString() !== deckUnit.unit.toString())
      const round = player.rounds[game.round - 1]
      if (combat === Combat.Close) {
        round.close.units.push(deckUnit)
      } else if (combat === Combat.Ranged) {
        round.ranged.units.push(deckUnit)
      } else if (combat === Combat.Siege) {
        round.siege.units.push(deckUnit)
      }
    }
  }
}
