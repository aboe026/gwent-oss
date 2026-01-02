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

/**
 * A class for determining the impact the Weather effect has on units effectiveStrength.
 */
export default class EffectWeather {
  private static logger = getLogger('EffectWeather')

  /**
   * Applies Weather effect to eligible units, setting their effectiveStrenth to 1. Does not effect heroes.
   *
   * @param config The configuration used to determine which units are eligible for Weather reset and how to change their effectiveStrength.
   * @param config.logPrefix The prefix to prepend to log statements.
   * @param config.weatherUnits A list of Units for the weathers effecting the row the unit under consideration is apart of.
   * @param config.weatherEffect The Effect database document for the Weather effect.
   * @param config.newDeckUnit The new DeckUnit being deployed to the battlefield.
   * @param config.rowGameUnit The GameUnit under consideration to be weathered.
   * @param config.rowUnit The Unit under consideration to be weathered.
   * @param config.units A list of all units on the battlefield.
   * @param config.userId The ID of the user whose unit is under consideration to be weathered.
   * @param config.currentPlayerId The ID of the user who played the newDeckUnit.
   * @returns An array of weathered impacts for the unit under consideration.
   */
  static applyWeather({
    logPrefix,
    weatherUnits,
    weatherEffect,
    newDeckUnit,
    rowGameUnit,
    rowUnit,
    units,
    userId,
    currentPlayerId,
  }: {
    logPrefix: string
    weatherUnits: UnitDbObject[]
    weatherEffect: EffectDbObject | undefined
    newDeckUnit: DeckUnitDbObject
    rowGameUnit: GameUnitDbObject
    rowUnit: UnitDbObject
    units: UnitDbObject[]
    userId: ObjectId
    currentPlayerId: ObjectId | undefined
  }): ImpactsByUnitId {
    const impacts: ImpactsByUnitId = {}

    if (EffectWeather.logger.isTraceEnabled()) {
      EffectWeather.logger.trace(`${logPrefix} rowUnit: "${JSON.stringify(rowUnit)}"`)
    }

    if (!rowUnit.hero) {
      const weathersToApply = weatherUnits
        .filter((unit) => unit._id.toString() !== rowGameUnit.unit.toString())
        .map((unit) => unit._id.toString())
      if (EffectWeather.logger.isTraceEnabled()) {
        EffectWeather.logger.trace(`${logPrefix} weathersToApply: "${JSON.stringify(weathersToApply)}"`)
      }
      let weathered = false
      for (let i = 0; i < weathersToApply.length && !weathered; i++) {
        const weatheringUnit = units.find((unit) => unit._id.toString() === weathersToApply[i])
        if (weatherEffect && weatheringUnit && rowGameUnit.effects) {
          weathered = true
          rowGameUnit.effectiveStrength = 1
          EffectWeather.logger.debug(
            `${logPrefix} weathering unit "${rowUnit._id}" by "${weatheringUnit._id}" for an effectiveStrength of "${rowGameUnit.effectiveStrength}"`
          )
          const reason: EffectFromUnitDbObject = {
            effect: weatherEffect._id,
            type: EffectReasonType.Unit,
            unit: weatheringUnit._id,
          }

          const gameUnitEffect: GameUnitEffectDbObject = {
            operator: EFFECT_OPERATOR.Set,
            reason,
            total: rowGameUnit.effectiveStrength,
          }
          if (EffectWeather.logger.isTraceEnabled()) {
            EffectWeather.logger.trace(`${logPrefix} gameUnitEffect: "${JSON.stringify(gameUnitEffect)}"`)
          }
          rowGameUnit.effects.push(gameUnitEffect)

          const impactables = [newDeckUnit.unit.toString()]
          if (
            impactables.includes(weatheringUnit._id.toString()) &&
            userId.toString() === currentPlayerId?.toString()
          ) {
            const impact: ImpactDbObject = {
              unit: rowGameUnit,
              user: userId,
            }
            if (EffectWeather.logger.isTraceEnabled()) {
              EffectWeather.logger.trace(`${logPrefix} impact: "${JSON.stringify(impact)}"`)
            }
            impacts[weatheringUnit._id.toString()] = [impact]
          }
        }
      }
    } else {
      EffectWeather.logger.debug(`${logPrefix} rowUnit "${rowUnit._id}" is hero so not susceptible to weather effect.`)
    }

    return impacts
  }
}
