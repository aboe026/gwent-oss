import {
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  GameUnitDbObject,
  PlayerCombatRowDbObject,
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

  if (hasScorchEffect) {
    const gameUnits = getGameUnits({
      combat: newUnit.scorchScope,
      players: newUnit.scorchScope
        ? game.players.filter((player) => player.user.toString() !== game.turn?.toString())
        : game.players,
      round: game.round,
    })
    const strongestGameUnits = getStrongestNonHeroUnits({
      gameUnits,
      units: battlefieldUnits,
      minimumStrength: newUnit.scorchMin,
    })
    const strongestUnitIds = strongestGameUnits.map((unit) => unit.unit.toString())

    for (const player of game.players) {
      // if no scorch scope, anyone can be effected/scorched
      // if scorch scope, only opponents (players who are not the current game turn player) can be effected/scorched
      const scorchablePlayer = !newUnit.scorchScope || player.user.toString() !== game.turn?.toString()
      if (scorchablePlayer) {
        const round = player.rounds[game.round - 1]
        const unitsLost: GameUnitDbObject[] = []
        if (newUnit.name === 'Scorch' && player.user.toString() === game.turn?.toString()) {
          unitsLost.push(newDeckUnit)
        }
        scorchUnitsInRow({
          row: round.close,
          strongestUnitIds,
          unitsLost,
        })
        scorchUnitsInRow({
          row: round.ranged,
          strongestUnitIds,
          unitsLost,
        })
        scorchUnitsInRow({
          row: round.siege,
          strongestUnitIds,
          unitsLost,
        })
        player.deck.discard.push(...unitsLost)
      }
    }
  }
}

export function scorchUnitsInRow({
  row,
  strongestUnitIds,
  unitsLost,
}: {
  row: PlayerCombatRowDbObject
  strongestUnitIds: string[]
  unitsLost: GameUnitDbObject[]
}) {
  for (let i = 0; i < row.units.length; i++) {
    const gameUnit = row.units[i]
    if (strongestUnitIds.includes(gameUnit.unit.toString())) {
      row.units.splice(i, 1)
      i = i - 1
      unitsLost.push(gameUnit)
    }
  }
}
