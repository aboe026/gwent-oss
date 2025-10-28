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
import { EFFECT_OPERATOR } from '@gwent/constants'
import { ImpactsByUnitId } from '../../resolver-util'

/**
 * A class for determining the impact the Morale effect has on units effectiveStrength.
 */
export default class EffectMorale {
  private static logger = getLogger('EffectMorale')

  /**
   * Gets a list of the IDs of the supplied units which have a Morale effect ability.
   *
   * @param config The configuration used to determine which units have the Morale ability.
   * @param config.logPrefix The prefix to prepend to log statements.
   * @param config.moraleEffect The Morale Effect database document used to check against units.
   * @param config.units The list of units to check if they contain the Morale effect in their abilities.
   * @returns A list of IDs of units which have the Morale effect ability.
   */
  // TODO: replace with getUnitIdsWithEffect
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

  /**
   * Applies Morale effect to eligible units, increasing their effectiveStrenth by 1 for each Morale effecting them.
   *
   * @param config The configuration used to determine which units are eligible for Morale boost and how to change their effectiveStrength.
   * @param config.logPrefix The prefix to prepend to log statements.
   * @param config.unitIdsWithMoraleInRow A list of IDs of units which contain the Morale effect ability in the battlefield row under consideration.
   * @param config.moraleEffect The Effect database document for the Morale effect.
   * @param config.newDeckUnit The new DeckUnit being deployed to the battlefield.
   * @param config.rowGameUnit The GameUnit under consideration to be moraled.
   * @param config.rowUnit The Unit under consideration to be moraled.
   * @param config.units A list of all units on the battlefield.
   * @param config.userId The ID of the user whose unit is under consideration to be moraled.
   * @param config.currentPlayerId The ID of the user who played the newDeckUnit.
   * @param config.transformedUnitIds A list of any unit IDs that were transformed on the battlefield by the newDeckUnit. Used to apply potential impacts to those Vildkaarls.
   * @returns An array of morale impacts for the unit under consideration.
   */
  static applyMorales({
    logPrefix,
    unitIdsWithMoraleInRow,
    moraleEffect,
    newDeckUnit,
    rowGameUnit,
    rowUnit,
    units,
    userId,
    currentPlayerId,
    transformedUnitIds,
  }: {
    logPrefix: string
    unitIdsWithMoraleInRow: string[]
    moraleEffect: EffectDbObject | undefined
    newDeckUnit: DeckUnitDbObject
    rowGameUnit: GameUnitDbObject
    rowUnit: UnitDbObject
    units: UnitDbObject[]
    userId: ObjectId
    currentPlayerId: ObjectId | undefined
    transformedUnitIds: string[]
  }): ImpactsByUnitId {
    const impacts: ImpactsByUnitId = {}

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
            operator: EFFECT_OPERATOR.Plus,
            reason,
            total: rowGameUnit.effectiveStrength,
          }
          if (EffectMorale.logger.isTraceEnabled()) {
            EffectMorale.logger.trace(`${logPrefix} gameUnitEffect: "${JSON.stringify(gameUnitEffect)}"`)
          }
          rowGameUnit.effects.push(gameUnitEffect)

          const impactables = [newDeckUnit.unit.toString(), ...transformedUnitIds]
          if (impactables.includes(moralingUnit._id.toString()) && userId.toString() === currentPlayerId?.toString()) {
            const impact: ImpactDbObject = {
              unit: rowGameUnit,
              user: userId,
            }
            if (EffectMorale.logger.isTraceEnabled()) {
              EffectMorale.logger.trace(`${logPrefix} impact: "${JSON.stringify(impact)}"`)
            }
            impacts[moralingUnit._id.toString()] = [impact]
          }
        }
      }
    } else {
      EffectMorale.logger.debug(`${logPrefix} rowUnit "${rowUnit._id}" is hero so not susceptible to morale effect.`)
    }

    return impacts
  }
}
