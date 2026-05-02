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
 * A class for determining the impact the Bond effect has on units effectiveStrength.
 */
export default class EffectBond {
  private static logger = getLogger('EffectBond')

  /**
   * Gets a list of the IDs of the supplied units which have a Bond effect ability.
   *
   * @param config The configuration used to determine which units have the Bond ability.
   * @param config.logPrefix The prefix to prepend to log statements.
   * @param config.bondEffect The Bond Effect database document used to check against units.
   * @param config.units The list of units to check if they contain the Bond effect in their abilities.
   * @param config.unitName The name of the bonded unit to match against.
   * @returns A list of IDs of units which have the Bond effect ability.
   */
  static getUnitsWithBond({
    logPrefix,
    bondEffect,
    units,
    unitName,
  }: {
    logPrefix: string
    bondEffect: EffectDbObject | undefined
    units: UnitDbObject[]
    unitName: string
  }): string[] {
    const unitIdsWithBond: string[] = []

    if (EffectBond.logger.isTraceEnabled()) {
      EffectBond.logger.trace(`${logPrefix} bondEffect: "${JSON.stringify(bondEffect)}"`)
      EffectBond.logger.trace(`${logPrefix} units: "${JSON.stringify(units)}"`)
    }

    if (bondEffect) {
      for (const unit of units) {
        if (unit.effects) {
          let unitHasBond = false
          for (let i = 0; i < unit.effects.length && !unitHasBond; i++) {
            const effect = unit.effects[i]
            if (effect.toString() === bondEffect._id.toString() && unit.name === unitName) {
              EffectBond.logger.debug(
                `${logPrefix} unit "${unit._id}" has bond effect "${bondEffect._id}" and matches name "${unitName}"`
              )
              unitHasBond = true
            }
          }
          if (unitHasBond) {
            unitIdsWithBond.push(unit._id.toString())
          }
        }
      }
    }

    if (EffectBond.logger.isTraceEnabled()) {
      EffectBond.logger.trace(`${logPrefix} unitIdsWithBond: "${JSON.stringify(unitIdsWithBond)}"`)
    }

    return unitIdsWithBond
  }

  /**
   * Applies Bond effect to eligible units, increasing their effectiveStrenth by a factor of 2 for each Bond effecting them.
   *
   * @param config The configuration used to determine which units are eligible for Bond boost and how to change their effectiveStrength.
   * @param config.logPrefix The prefix to prepend to log statements.
   * @param config.unitIdsWithBondInRow A list of IDs of units which contain the Bond effect ability in the battlefield row under consideration.
   * @param config.bondEffect The Effect database document for the Bond effect.
   * @param config.newDeckUnit The new DeckUnit being deployed to the battlefield.
   * @param config.musteredUnitIds A list of any unit IDs that were mustered to the battlefield by the newDeckUnit. Used to apply potential impacts to those musters.
   * @param config.transformedUnitIds A list of any unit IDs that were transformed on the battlefield by the newDeckUnit. Used to apply potential impacts to those Vildkaarls.
   * @param config.rowFieldUnit The FieldUnit under consideration to be bonded.
   * @param config.rowUnit The Unit under consideration to be bonded.
   * @param config.units A list of all units on the battlefield.
   * @param config.userId The ID of the user whose unit is under consideration to be bonded.
   * @param config.currentPlayerId The ID of the user who played the newDeckUnit.
   * @returns An array of bond impacts for the unit under consideration.
   */
  static applyBonds({
    logPrefix,
    unitIdsWithBondInRow,
    bondEffect,
    newDeckUnit,
    musteredUnitIds,
    transformedUnitIds,
    rowFieldUnit,
    rowUnit,
    units,
    userId,
    currentPlayerId,
  }: {
    logPrefix: string
    unitIdsWithBondInRow: string[]
    bondEffect: EffectDbObject | undefined
    newDeckUnit: DeckUnitDbObject
    musteredUnitIds: string[]
    transformedUnitIds: string[]
    rowFieldUnit: FieldUnitDbObject
    rowUnit: UnitDbObject
    units: UnitDbObject[]
    userId: ObjectId
    currentPlayerId: ObjectId | undefined
  }): ImpactsByUnitId {
    const impacts: ImpactsByUnitId = {}

    if (EffectBond.logger.isTraceEnabled()) {
      EffectBond.logger.trace(`${logPrefix} rowUnit: "${JSON.stringify(rowUnit)}"`)
    }

    if (bondEffect && rowFieldUnit.effects) {
      const impactables = [newDeckUnit.unit.toString(), ...musteredUnitIds, ...transformedUnitIds]
      const idAndUnits: {
        id: string
        unit: UnitDbObject
      }[] = []
      for (const unitIdWithBond of unitIdsWithBondInRow) {
        const bondingUnit = units.find((unit) => unit._id.toString() === unitIdWithBond)
        if (bondingUnit) {
          idAndUnits.push({
            id: unitIdWithBond,
            unit: bondingUnit,
          })
          if (unitIdWithBond !== rowFieldUnit.unit.toString()) {
            rowFieldUnit.effectiveStrength = (rowFieldUnit.effectiveStrength || 0) * 2
            EffectBond.logger.debug(
              `${logPrefix} adding bond boost to "${rowUnit._id}" from "${bondingUnit._id}" for an effectiveStrength of "${rowFieldUnit.effectiveStrength}"`
            )
            const reason: EffectFromUnitDbObject = {
              effect: bondEffect._id,
              type: EffectReasonType.Unit,
              unit: bondingUnit._id,
            }

            const fieldUnitEffect: FieldUnitEffectDbObject = {
              operator: EFFECT_OPERATOR.Double,
              reason,
              total: rowFieldUnit.effectiveStrength,
            }
            if (EffectBond.logger.isTraceEnabled()) {
              EffectBond.logger.trace(`${logPrefix} fieldUnitEffect: "${JSON.stringify(fieldUnitEffect)}"`)
            }
            rowFieldUnit.effects.push(fieldUnitEffect)
          }
        } else {
          const message = `Could not find unit for bonding unit ID "${unitIdWithBond}"`
          EffectBond.logger.error(`${logPrefix} failed: ${message}`)
          throw Error(`${message}.`)
        }
      }
      // wait to set impacts so know full effectiveStrength of rowFieldUnit
      for (const idAndUnit of idAndUnits) {
        const { unit: bondingUnit } = idAndUnit
        const impactsForUnit: ImpactDbObject[] = []
        if (
          bondingUnit._id.toString() !== rowFieldUnit.unit.toString() &&
          impactables.includes(bondingUnit._id.toString()) &&
          userId.toString() === currentPlayerId?.toString()
        ) {
          const impact: ImpactDbObject = {
            unit: {
              ...rowFieldUnit,
              type: GameUnitType.Field,
            },
            user: userId,
          }
          if (EffectBond.logger.isTraceEnabled()) {
            EffectBond.logger.trace(`${logPrefix} impact: "${JSON.stringify(impact)}"`)
          }
          impactsForUnit.push(impact)
        }
        impacts[bondingUnit._id.toString()] = impactsForUnit
      }
    }

    return impacts
  }
}
