import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import {
  DeckUnitDbObject,
  EffectDbObject,
  EffectFromUnitDbObject,
  FieldUnitDbObject,
  FieldUnitEffectDbObject,
  ImpactDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import { EFFECT_OPERATOR } from '@gwent/constants'
import { EffectReasonType, GameUnitType } from '@gwent/graphql-schema'
import { ImpactsByUnitId } from '../../resolver-util'

/**
 * A class for determining the impact the Horn effect has on units effectiveStrength.
 */
export default class EffectHorn {
  private static logger = getLogger('EffectHorn')

  /**
   * Applies Horn effect to eligible units, increasing their effectiveStrenth by a factor of 2 if any Horn effects them. Does not compound with multiple horns.
   *
   * @param config The configuration used to determine which units are eligible for Horn boost and how to change their effectiveStrength.
   * @param config.logPrefix The prefix to prepend to log statements.
   * @param config.unitIdsWithHornInRow A list of IDs of units which contain the Horn effect ability in the battlefield row under consideration.
   * @param config.hornEffect The Effect database document for the Horn effect.
   * @param config.newDeckUnit The new DeckUnit being deployed to the battlefield.
   * @param config.rowFieldUnit The FieldUnit under consideration to be horned.
   * @param config.rowUnit The Unit under consideration to be horned.
   * @param config.units A list of all units on the battlefield.
   * @param config.userId The ID of the user whose unit is under consideration to be horned.
   * @param config.currentPlayerId The ID of the user who played the newDeckUnit.
   * @returns An array of horn impacts for the unit under consideration.
   */
  static applyHorn({
    logPrefix,
    unitIdsWithHornInRow,
    hornEffect,
    newDeckUnit,
    rowFieldUnit,
    rowUnit,
    units,
    userId,
    currentPlayerId,
  }: {
    logPrefix: string
    unitIdsWithHornInRow: string[]
    hornEffect: EffectDbObject | undefined
    newDeckUnit: DeckUnitDbObject
    rowFieldUnit: FieldUnitDbObject
    rowUnit: UnitDbObject
    units: UnitDbObject[]
    userId: ObjectId
    currentPlayerId: ObjectId | undefined
  }): ImpactsByUnitId {
    const impacts: ImpactsByUnitId = {}

    if (EffectHorn.logger.isTraceEnabled()) {
      EffectHorn.logger.trace(`${logPrefix} rowUnit: "${JSON.stringify(rowUnit)}"`)
    }

    if (!rowUnit.hero) {
      const hornsToApply = unitIdsWithHornInRow.filter((id) => id !== rowFieldUnit.unit.toString())
      if (EffectHorn.logger.isTraceEnabled()) {
        EffectHorn.logger.trace(`${logPrefix} hornsToApply: "${JSON.stringify(hornsToApply)}"`)
      }
      if (unitIdsWithHornInRow.length > 0 && hornsToApply.length === 0) {
        impacts[newDeckUnit.unit.toString()] = []
      } else {
        let horned = false
        for (let i = 0; i < hornsToApply.length && !horned; i++) {
          const horningUnit = units.find((unit) => unit._id.toString() === hornsToApply[i])
          if (hornEffect && horningUnit && rowFieldUnit.effects) {
            horned = true
            rowFieldUnit.effectiveStrength = (rowFieldUnit.effectiveStrength || 0) * 2
            EffectHorn.logger.debug(
              `${logPrefix} adding horn boost to "${rowUnit._id}" from "${horningUnit._id}" for an effectiveStrength of "${rowFieldUnit.effectiveStrength}"`
            )
            const reason: EffectFromUnitDbObject = {
              effect: hornEffect._id,
              type: EffectReasonType.Unit,
              unit: horningUnit._id,
            }

            const fieldUnitEffect: FieldUnitEffectDbObject = {
              operator: EFFECT_OPERATOR.Double,
              reason,
              total: rowFieldUnit.effectiveStrength,
            }
            if (EffectHorn.logger.isTraceEnabled()) {
              EffectHorn.logger.trace(`${logPrefix} fieldUnitEffect: "${JSON.stringify(fieldUnitEffect)}"`)
            }
            rowFieldUnit.effects.push(fieldUnitEffect)

            const impactables = [newDeckUnit.unit.toString()]
            if (impactables.includes(horningUnit._id.toString()) && userId.toString() === currentPlayerId?.toString()) {
              const impact: ImpactDbObject = {
                unit: {
                  ...rowFieldUnit,
                  type: GameUnitType.Field,
                },
                user: userId,
              }
              if (EffectHorn.logger.isTraceEnabled()) {
                EffectHorn.logger.trace(`${logPrefix} impact: "${JSON.stringify(impact)}"`)
              }
              impacts[horningUnit._id.toString()] = [impact]
            }
          }
        }
      }
    } else {
      EffectHorn.logger.debug(`${logPrefix} rowUnit "${rowUnit._id}" is hero so not susceptible to horn effect.`)
    }

    return impacts
  }
}
