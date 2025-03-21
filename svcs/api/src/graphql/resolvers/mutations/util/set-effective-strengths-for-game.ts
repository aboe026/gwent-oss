import { ObjectId } from 'mongodb'

import {
  EffectDbObject,
  EffectFromUnitDbObject,
  EffectKey,
  GameDbObject,
  PlayerCombatRowDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import { EffectReasonType } from '@gwent/graphql-schema'
import PresentableError from '../../../../util/presentable-error'

/**
 * Set the effective strengths for all units played in the current round of a game, taking into account unit effects and leader abilities present.
 *
 * @param config The configuration used to calculate effective strengths for units.
 * @param config.game The Game to calculate effective strengths on for the active round.
 * @param config.units All the database Unit objects present in the round for the game.
 * @param config.effects All the database Effect objects for any unit effect present in the round for the game.
 */
export default function setEffectiveStrengthsForGame({
  game,
  units,
  effects,
}: {
  game: GameDbObject
  units: UnitDbObject[]
  effects: EffectDbObject[]
}) {
  for (const player of game.players) {
    setEffectiveStrengthsForCombatRow({
      row: player.rounds[game.round - 1].close,
      units,
      effects,
    })
    setEffectiveStrengthsForCombatRow({
      row: player.rounds[game.round - 1].ranged,
      units,
      effects,
    })
    setEffectiveStrengthsForCombatRow({
      row: player.rounds[game.round - 1].siege,
      units,
      effects,
    })
  }
}

/**
 * Calculates the effective strength for all units in a combat row.
 *
 * @param config The configuration used to determine effective strengths for the units in the combat row.
 * @param config.row The combat row contianing the units to calculate effective strengths for.
 * @param config.units All the database Unit objects present in the round for the game.
 * @param config.effects All the database Effect objects for any unit effect present in the round for the game.
 */
export function setEffectiveStrengthsForCombatRow({
  row,
  units,
  effects,
}: {
  row: PlayerCombatRowDbObject
  units: UnitDbObject[]
  effects: EffectDbObject[]
}) {
  const rowDbUnits: UnitDbObject[] = []
  for (const rowUnit of row.units) {
    const matchingUnit = units.find((unit) => unit._id.toString() === rowUnit.unit.toString())
    if (matchingUnit) {
      rowDbUnits.push(matchingUnit)
    } else {
      throw new PresentableError(`Could not find Unit with ID "${rowUnit.unit}"`)
    }
  }
  let moraleEffectId = ''
  const moraleEffect = effects.find((effect) => effect.key === EffectKey.Morale)
  if (moraleEffect) {
    moraleEffectId = moraleEffect._id.toString()
  }

  const moraleIdsInRow: string[] = []
  if (moraleEffectId) {
    for (const rowDbUnit of rowDbUnits) {
      if (rowDbUnit.effects) {
        let unitHasMorale = false
        for (let i = 0; i < rowDbUnit.effects.length && !unitHasMorale; i++) {
          const effect = rowDbUnit.effects[i]
          if (effect.toString() === moraleEffectId) {
            unitHasMorale = true
          }
        }
        if (unitHasMorale) {
          moraleIdsInRow.push(rowDbUnit._id.toString())
        }
      }
    }
  }

  for (const rowUnit of row.units) {
    const dbUnit = units.find((unit) => unit._id.toString() === rowUnit.unit.toString())
    if (dbUnit && dbUnit.strength !== undefined && dbUnit.strength !== null) {
      rowUnit.effectiveStrength = dbUnit.strength
      rowUnit.effects = []

      if (!dbUnit.hero) {
        const moralesToApply = moraleIdsInRow.filter((id) => id !== rowUnit.unit.toString())
        for (const moraleId of moralesToApply) {
          rowUnit.effectiveStrength += 1
          const moraleDbUnit = units.find((unit) => unit._id.toString() === moraleId)
          if (moraleDbUnit) {
            const reason: EffectFromUnitDbObject = {
              effect: new ObjectId(moraleEffectId),
              type: EffectReasonType.Unit,
              unit: moraleDbUnit._id,
            }
            rowUnit.effects.push({
              operator: '+1',
              reason,
              total: rowUnit.effectiveStrength,
            })
          }
        }
      }
    }
  }
}
