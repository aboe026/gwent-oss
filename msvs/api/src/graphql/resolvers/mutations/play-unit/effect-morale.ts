import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import {
  DeckUnitDbObject,
  EffectDbObject,
  EffectFromUnitDbObject,
  GameUnitDbObject,
  GameUnitEffectDbObject,
  ImpactDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import { EffectReasonType } from '@gwent/graphql-schema'

export default class EffectMorale {
  private static logger = getLogger('EffectMorale')

  static getUnitsWithMorale({
    logPrefix,
    moraleEffect,
    units,
  }: {
    logPrefix: string
    moraleEffect: EffectDbObject | undefined
    units: UnitDbObject[]
  }): string[] {
    const unitIdsWithMorale: string[] = []

    if (EffectMorale.logger.isTraceEnabled()) {
      EffectMorale.logger.trace(`${logPrefix} moraleEffect: "${JSON.stringify(moraleEffect)}"`)
      EffectMorale.logger.trace(`${logPrefix} units: "${JSON.stringify(units)}"`)
    }

    if (moraleEffect) {
      for (const unit of units) {
        if (unit.effects) {
          let unitHasMorale = false
          for (let i = 0; i < unit.effects.length && !unitHasMorale; i++) {
            const effect = unit.effects[i]
            if (effect.toString() === moraleEffect._id.toString()) {
              EffectMorale.logger.debug(`${logPrefix} unit "${unit._id}" has morale effect "${moraleEffect._id}"`)
              unitHasMorale = true
            }
          }
          if (unitHasMorale) {
            unitIdsWithMorale.push(unit._id.toString())
          }
        }
      }
    }

    if (EffectMorale.logger.isTraceEnabled()) {
      EffectMorale.logger.trace(`${logPrefix} unitIdsWithMorale: "${JSON.stringify(unitIdsWithMorale)}"`)
    }

    return unitIdsWithMorale
  }

  static applyMorales({
    logPrefix,
    unitIdsWithMoraleInRow,
    moraleEffect,
    newDeckUnit,
    rowGameUnit,
    rowUnit,
    units,
    userId,
  }: {
    logPrefix: string
    unitIdsWithMoraleInRow: string[]
    moraleEffect: EffectDbObject | undefined
    newDeckUnit: DeckUnitDbObject
    rowGameUnit: GameUnitDbObject
    rowUnit: UnitDbObject
    units: UnitDbObject[]
    userId: ObjectId
  }): ImpactDbObject[] {
    const impacts: ImpactDbObject[] = []

    if (EffectMorale.logger.isTraceEnabled()) {
      EffectMorale.logger.trace(`${logPrefix} rowUnit: "${JSON.stringify(rowUnit)}"`)
    }

    if (!rowUnit.hero) {
      const moralesToApply = unitIdsWithMoraleInRow.filter((id) => id !== rowGameUnit.unit.toString())
      if (EffectMorale.logger.isTraceEnabled()) {
        EffectMorale.logger.trace(`${logPrefix} moralesToApply: "${JSON.stringify(moralesToApply)}"`)
      }
      for (const unitIdWithMorale of moralesToApply) {
        const moralingUnit = units.find((unit) => unit._id.toString() === unitIdWithMorale)
        if (moraleEffect && moralingUnit && rowGameUnit.effects) {
          rowGameUnit.effectiveStrength = (rowGameUnit.effectiveStrength || 0) + 1
          EffectMorale.logger.debug(
            `${logPrefix} adding morale boost to "${rowUnit._id}" from "${moralingUnit._id}" for an effectiveStrength of "${rowGameUnit.effectiveStrength}"`
          )
          const reason: EffectFromUnitDbObject = {
            effect: moraleEffect._id,
            type: EffectReasonType.Unit,
            unit: moralingUnit._id,
          }

          const gameUnitEffect: GameUnitEffectDbObject = {
            operator: '+1',
            reason,
            total: rowGameUnit.effectiveStrength,
          }
          if (EffectMorale.logger.isTraceEnabled()) {
            EffectMorale.logger.trace(`${logPrefix} gameUnitEffect: "${JSON.stringify(gameUnitEffect)}"`)
          }
          rowGameUnit.effects.push(gameUnitEffect)

          if (moralingUnit._id.toString() === newDeckUnit.unit.toString()) {
            const impact: ImpactDbObject = {
              unit: rowGameUnit,
              user: userId,
            }
            if (EffectMorale.logger.isTraceEnabled()) {
              EffectMorale.logger.trace(`${logPrefix} impact: "${JSON.stringify(impact)}"`)
            }
            impacts.push(impact)
          }
        }
      }
    } else {
      EffectMorale.logger.debug(`${logPrefix} rowUnit "${rowUnit._id}" is hero so not susceptible to morale effect.`)
    }

    return impacts
  }
}
