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
   * @param config.rowGameUnit The GameUnit under consideration to be bonded.
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
    rowGameUnit,
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
    rowGameUnit: GameUnitDbObject
    rowUnit: UnitDbObject
    units: UnitDbObject[]
    userId: ObjectId
    currentPlayerId: ObjectId | undefined
  }): ImpactsByUnitId {
    const impacts: ImpactsByUnitId = {}

    if (EffectBond.logger.isTraceEnabled()) {
      EffectBond.logger.trace(`${logPrefix} rowUnit: "${JSON.stringify(rowUnit)}"`)
    }

    const bondsToApply = unitIdsWithBondInRow.filter((id) => id !== rowGameUnit.unit.toString())
    if (EffectBond.logger.isTraceEnabled()) {
      EffectBond.logger.trace(`${logPrefix} bondsToApply: "${JSON.stringify(bondsToApply)}"`)
    }
    for (const unitIdWithBond of bondsToApply) {
      const bondingUnit = units.find((unit) => unit._id.toString() === unitIdWithBond)
      if (bondEffect && bondingUnit && rowGameUnit.effects) {
        rowGameUnit.effectiveStrength = (rowGameUnit.effectiveStrength || 0) * 2
        EffectBond.logger.debug(
          `${logPrefix} adding bond boost to "${rowUnit._id}" from "${bondingUnit._id}" for an effectiveStrength of "${rowGameUnit.effectiveStrength}"`
        )
        const reason: EffectFromUnitDbObject = {
          effect: bondEffect._id,
          type: EffectReasonType.Unit,
          unit: bondingUnit._id,
        }

        const gameUnitEffect: GameUnitEffectDbObject = {
          operator: 'x2',
          reason,
          total: rowGameUnit.effectiveStrength,
        }
        if (EffectBond.logger.isTraceEnabled()) {
          EffectBond.logger.trace(`${logPrefix} gameUnitEffect: "${JSON.stringify(gameUnitEffect)}"`)
        }
        rowGameUnit.effects.push(gameUnitEffect)

        if (
          (bondingUnit._id.toString() === newDeckUnit.unit.toString() ||
            musteredUnitIds.includes(bondingUnit._id.toString())) &&
          userId.toString() === currentPlayerId?.toString()
        ) {
          const impact: ImpactDbObject = {
            unit: rowGameUnit,
            user: userId,
          }
          if (EffectBond.logger.isTraceEnabled()) {
            EffectBond.logger.trace(`${logPrefix} impact: "${JSON.stringify(impact)}"`)
          }
          impacts[bondingUnit._id.toString()] = [impact]
        }
      }
    }

    return impacts
  }
}
