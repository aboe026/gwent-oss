import { Combat } from '@gwent/graphql-schema/resolver-typings'
import { DeckUnitDbObject, EffectDbObject, GameDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import ScorchBattlefield from './scorch-battlefield'

/**
 * Modifies the battlefield of the current round in a game due to the deployment of a new unit. Other units on or off the battlefield may be impacted by unit effects.
 *
 * @param config The configuration used to determine the impact the new unit has on the battlefield.
 * @param config.game The game whose battlefield should have the units deployment applied to it.
 * @param config.deckUnit The new unit being deployed to the battlefield.
 * @param config.combat The combat row the unit is being deployed to.
 */
export default function modifyBattlefieldWithNewUnit({
  battlefieldUnits,
  combat,
  effects,
  game,
  logPrefix,
  newDeckUnit,
}: {
  battlefieldUnits: UnitDbObject[]
  combat?: Combat | null
  effects: EffectDbObject[]
  game: GameDbObject
  logPrefix: string
  newDeckUnit: DeckUnitDbObject
}) {
  for (const player of game.players) {
    if (player.user.toString() === game.turn?.toString()) {
      player.deck.hand = player.deck.hand.filter((handUnit) => handUnit.unit.toString() !== newDeckUnit.unit.toString())
      const round = player.rounds[game.round - 1]
      if (combat === Combat.Close) {
        round.close.units.push(newDeckUnit)
      } else if (combat === Combat.Ranged) {
        round.ranged.units.push(newDeckUnit)
      } else if (combat === Combat.Siege) {
        round.siege.units.push(newDeckUnit)
      }
    }
  }

  ScorchBattlefield.scorchBattlefield({
    battlefieldUnits,
    effects,
    game,
    logPrefix,
    newDeckUnit,
  })
}
