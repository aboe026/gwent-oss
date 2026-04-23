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
import { EffectReasonType, GameUnitType } from '@gwent/graphql-schema'
import { EFFECT_OPERATOR } from '@gwent/constants'
import { ImpactsByUnitId } from '../../resolver-util'

/**
 * A class for determining the impact the Morale effect has on units effectiveStrength.
 */
export default class EffectMorale {
  private static logger = getLogger('EffectMorale')

  /**
   * Applies Morale effect to eligible units, increasing their effectiveStrenth by 1 for each Morale effecting them.
   *
   * @param config The configuration used to determine which units are eligible for Morale boost and how to change their effectiveStrength.
   * @param config.logPrefix The prefix to prepend to log statements.
   * @param config.unitIdsWithMoraleInRow A list of IDs of units which contain the Morale effect ability in the battlefield row under consideration.
   * @param config.moraleEffect The Effect database document for the Morale effect.
   * @param config.newDeckUnit The new DeckUnit being deployed to the battlefield.
   * @param config.rowFieldUnit The FieldUnit under consideration to be moraled.
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
    rowFieldUnit,
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
    rowFieldUnit: FieldUnitDbObject
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

    for (const unitIdWithMorale of unitIdsWithMoraleInRow) {
      const moralingUnit = units.find((unit) => unit._id.toString() === unitIdWithMorale)
      if (moraleEffect && moralingUnit && rowFieldUnit.effects) {
        const impactsForMoralingUnit: ImpactDbObject[] = []
        if (unitIdWithMorale !== rowFieldUnit.unit.toString()) {
          if (rowUnit.hero) {
            EffectMorale.logger.debug(
              `${logPrefix} rowUnit "${rowUnit._id}" is hero so not susceptible to morale effect.`
            )
          } else if (rowUnit.strength === undefined || rowUnit.strength === null) {
            EffectMorale.logger.debug(
              `${logPrefix} rowUnit "${rowUnit._id}" does not have strength so not susceptible to morale effect.`
            )
          } else {
            rowFieldUnit.effectiveStrength = (rowFieldUnit.effectiveStrength || 0) + 1
            EffectMorale.logger.debug(
              `${logPrefix} adding morale boost to "${rowUnit._id}" from "${moralingUnit._id}" for an effectiveStrength of "${rowFieldUnit.effectiveStrength}"`
            )
            const reason: EffectFromUnitDbObject = {
              effect: moraleEffect._id,
              type: EffectReasonType.Unit,
              unit: moralingUnit._id,
            }

            const fieldUnitEffect: FieldUnitEffectDbObject = {
              operator: EFFECT_OPERATOR.Plus,
              reason,
              total: rowFieldUnit.effectiveStrength,
            }
            if (EffectMorale.logger.isTraceEnabled()) {
              EffectMorale.logger.trace(`${logPrefix} fieldUnitEffect: "${JSON.stringify(fieldUnitEffect)}"`)
            }
            rowFieldUnit.effects.push(fieldUnitEffect)

            const impactables = [newDeckUnit.unit.toString(), ...transformedUnitIds]
            if (
              impactables.includes(moralingUnit._id.toString()) &&
              userId.toString() === currentPlayerId?.toString()
            ) {
              const impact: ImpactDbObject = {
                unit: {
                  ...rowFieldUnit,
                  type: GameUnitType.Field,
                },
                user: userId,
              }
              if (EffectMorale.logger.isTraceEnabled()) {
                EffectMorale.logger.trace(`${logPrefix} impact: "${JSON.stringify(impact)}"`)
              }
              impactsForMoralingUnit.push(impact)
            }
          }
        }
        impacts[moralingUnit._id.toString()] = impactsForMoralingUnit
      }
    }

    return impacts
  }
}
