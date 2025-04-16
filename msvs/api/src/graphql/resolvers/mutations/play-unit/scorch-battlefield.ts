import {
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  GameUnitDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import getEffectWithKey from './get-effect-with-key'
import getGameUnits from './get-game-units'
import getStrongestNonHeroUnits from './get-strongest-non-hero-units'

/**
 * Modifies the battlefield of the current round in a game due to the deployment of a new unit. Other units on or off the battlefield may be impacted by unit effects.
 *
 * @param config The configuration used to determine the impact the new unit has on the battlefield.
 * @param config.game The game whose battlefield should have the units deployment applied to it.
 * @param config.deckUnit The new unit being deployed to the battlefield.
 * @param config.combat The combat row the unit is being deployed to.
 */
export default function scorchBattlefield({
  battlefieldUnits,
  effects,
  game,
  newDeckUnit,
}: {
  battlefieldUnits: UnitDbObject[]
  effects: EffectDbObject[]
  game: GameDbObject
  newDeckUnit: DeckUnitDbObject
}) {
  const scorchEffect = getEffectWithKey({
    effectKey: EffectKey.Scorch,
    effects,
  })
  const newUnit = battlefieldUnits.find((unit) => unit._id.toString() === newDeckUnit.unit.toString())
  if (!newUnit) {
    throw Error(`Could not find unit for new deck unit "${newDeckUnit.unit}"`)
  }

  const hasScorchEffect =
    scorchEffect && newUnit.effects && newUnit.effects.map((id) => id.toString()).includes(scorchEffect._id.toString())

  // scorch, remove strongest non-hero unit(s) from battlefield
  if (hasScorchEffect) {
    const gameUnits = getGameUnits({
      combat: newUnit.scorchScope,
      players: newUnit.scorchScope
        ? game.players.filter((player) => player.user.toString() !== game.turn?.toString())
        : game.players,
      round: game.round - 1,
    })
    const strongestGameUnits = getStrongestNonHeroUnits({
      gameUnits,
      units: battlefieldUnits,
      minimumStrength: newUnit.scorchMin,
    })
    const strongestUnitIds = strongestGameUnits.map((unit) => unit.unit.toString())
    for (const player of game.players) {
      if (newUnit.name === 'Scorch') {
        player.deck.discard.push(newDeckUnit)
      }
      const round = player.rounds[game.round - 1]
      const unitsLost: GameUnitDbObject[] = []
      round.close.units = round.close.units.filter((unit) => {
        if (strongestUnitIds.includes(unit.unit.toString())) {
          unitsLost.push(unit)
          return false
        }
        return true
      })
      round.ranged.units = round.ranged.units.filter((unit) => {
        if (strongestUnitIds.includes(unit.unit.toString())) {
          unitsLost.push(unit)
          return false
        }
        return true
      })
      round.siege.units = round.siege.units.filter((unit) => {
        if (strongestUnitIds.includes(unit.unit.toString())) {
          unitsLost.push(unit)
          return false
        }
        return true
      })
      player.deck.discard.push(...unitsLost)
    }
  }
}
