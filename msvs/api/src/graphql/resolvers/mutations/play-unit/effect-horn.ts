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
import { EFFECT_OPERATOR } from '@gwent/constants'
import { EffectReasonType } from '@gwent/graphql-schema'
import { ImpactsByUnitId } from '../../resolver-util'

export default class EffectHorn {
  private static logger = getLogger('EffectHorn')

  static applyHorn({
    logPrefix,
    unitIdsWithHornInRow,
    hornEffect,
    newDeckUnit,
    rowGameUnit,
    rowUnit,
    units,
    userId,
    currentPlayerId,
  }: {
    logPrefix: string
    unitIdsWithHornInRow: string[]
    hornEffect: EffectDbObject | undefined
    newDeckUnit: DeckUnitDbObject
    rowGameUnit: GameUnitDbObject
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
      const hornsToApply = unitIdsWithHornInRow.filter((id) => id !== rowGameUnit.unit.toString())
      if (EffectHorn.logger.isTraceEnabled()) {
        EffectHorn.logger.trace(`${logPrefix} hornsToApply: "${JSON.stringify(hornsToApply)}"`)
      }
      let horned = false
      for (let i = 0; i < hornsToApply.length && !horned; i++) {
        const horningUnit = units.find((unit) => unit._id.toString() === hornsToApply[i])
        if (hornEffect && horningUnit && rowGameUnit.effects) {
          horned = true
          rowGameUnit.effectiveStrength = (rowGameUnit.effectiveStrength || 0) * 2
          EffectHorn.logger.debug(
            `${logPrefix} adding horn boost to "${rowUnit._id}" from "${horningUnit._id}" for an effectiveStrength of "${rowGameUnit.effectiveStrength}"`
          )
          const reason: EffectFromUnitDbObject = {
            effect: hornEffect._id,
            type: EffectReasonType.Unit,
            unit: horningUnit._id,
          }

          const gameUnitEffect: GameUnitEffectDbObject = {
            operator: EFFECT_OPERATOR.Double,
            reason,
            total: rowGameUnit.effectiveStrength,
          }
          if (EffectHorn.logger.isTraceEnabled()) {
            EffectHorn.logger.trace(`${logPrefix} gameUnitEffect: "${JSON.stringify(gameUnitEffect)}"`)
          }
          rowGameUnit.effects.push(gameUnitEffect)

          const impactables = [newDeckUnit.unit.toString()]
          if (impactables.includes(horningUnit._id.toString()) && userId.toString() === currentPlayerId?.toString()) {
            const impact: ImpactDbObject = {
              unit: rowGameUnit,
              user: userId,
            }
            if (EffectHorn.logger.isTraceEnabled()) {
              EffectHorn.logger.trace(`${logPrefix} impact: "${JSON.stringify(impact)}"`)
            }
            impacts[horningUnit._id.toString()] = [impact]
          }
        }
      }
    } else {
      EffectHorn.logger.debug(`${logPrefix} rowUnit "${rowUnit._id}" is hero so not susceptible to horn effect.`)
    }

    return impacts
  }
}
