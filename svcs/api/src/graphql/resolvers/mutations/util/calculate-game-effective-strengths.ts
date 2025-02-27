import { ObjectId } from 'mongodb'

import {
  EffectDbObject,
  EffectFromUnitDbObject,
  EffectKey,
  GameDbObject,
  GamePlayerDbObject,
  PlayerCombatRowDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import { EffectReasonType } from '@gwent/graphql-schema'
import PresentableError from '../../../../util/presentable-error'

export default class CalculateGameEffectiveStrengths {
  static calculateEffectiveStrengths({
    game,
    units,
    effects,
  }: {
    game: GameDbObject
    units: UnitDbObject[]
    effects: EffectDbObject[]
  }): GamePlayerDbObject[] {
    return game.players.map((player) => {
      return {
        ...player,
        rounds: player.rounds.map((round, index) => {
          if (index === game.round - 1) {
            round.close = CalculateGameEffectiveStrengths.calculateEffectiveStrengthsForRow({
              row: round.close,
              units,
              effects,
            })
            round.ranged = CalculateGameEffectiveStrengths.calculateEffectiveStrengthsForRow({
              row: round.ranged,
              units,
              effects,
            })
            round.siege = CalculateGameEffectiveStrengths.calculateEffectiveStrengthsForRow({
              row: round.siege,
              units,
              effects,
            })
          }
          return round
        }),
      }
    })
  }

  private static calculateEffectiveStrengthsForRow({
    row,
    units,
    effects,
  }: {
    row: PlayerCombatRowDbObject
    units: UnitDbObject[]
    effects: EffectDbObject[]
  }): PlayerCombatRowDbObject {
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

    // TODO: make into method
    // TODO: have separate file for these helper methods around game logic?
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

    return {
      ...row,
      units: row.units.map((rowUnit) => {
        const dbUnit = units.find((unit) => unit._id.toString() === rowUnit.unit.toString())
        if (dbUnit?.strength) {
          rowUnit.effectiveStrength = dbUnit.strength
          rowUnit.effects = []

          if (!dbUnit?.hero) {
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

        return rowUnit
      }),
    }
  }
}
