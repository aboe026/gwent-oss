import { Combat } from '@gwent/graphql-schema/resolver-typings'
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
export default function modifyBattlefieldWithNewUnit({
  battlefieldUnits,
  combat,
  effects,
  game,
  newDeckUnit,
}: {
  battlefieldUnits: UnitDbObject[]
  combat?: Combat | null
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
  const isScorch =
    scorchEffect && newUnit.effects && newUnit.effects.map((id) => id.toString()).includes(scorchEffect._id.toString())
  for (const player of game.players) {
    if (player.user.toString() === game.turn?.toString()) {
      player.deck.hand = player.deck.hand.filter((handUnit) => handUnit.unit.toString() !== newDeckUnit.unit.toString())
      if (newUnit.name === 'Scorch') {
        player.deck.discard.push(newDeckUnit)
      } else {
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
  }

  // scorch, remove strongest non-hero unit(s) from battlefield
  if (isScorch) {
    const gameUnits = getGameUnits(game)
    const strongestGameUnits = getStrongestNonHeroUnits({
      gameUnits,
      units: battlefieldUnits,
    })
    const strongestUnitIds = strongestGameUnits.map((unit) => unit.unit.toString())
    for (const player of game.players) {
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
