import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import {
  DeckUnitDbObject,
  EffectDbObject,
  EffectFromUnitDbObject,
  FieldUnitDbObject,
  FieldUnitEffectDbObject,
  GameDbObject,
  ImpactDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import { EFFECT_OPERATOR } from '@gwent/constants'
import { EffectReasonType, GameUnitType } from '@gwent/graphql-schema'
import { ImpactsByUnitId } from '../../resolver-util'
import { PlayerWeatherUnit } from './get-weather-units-for-row'

/**
 * A class for determining the impact the Weather effect has on units effectiveStrength.
 */
export default class EffectWeather {
  private static logger = getLogger('EffectWeather')

  /**
   * Applies potential weathering unit to battlefield, adding it unless a Clear Weather which removes all weathers.
   *
   * @param config The configuration used to weather the battlefield.
   * @param config.game The Game the potential weather is for.
   * @param config.logPrefix What to prepend log statements with.
   * @param config.newDeckUnit The new DeckUnit being added to the battlefield.
   * @param config.newUnit The new Unit being added to the battlefield.
   * @param config.isWeather Whether or not the new unit being played has the Weather effect.
   * @returns Any potential impacts the new unit has on the battlefield in terms of Weather, as well as if the new unit itself has the Weather effect.
   */
  static weatherBattlefield({
    game,
    logPrefix,
    newDeckUnit,
    newUnit,
    isWeather,
  }: {
    game: GameDbObject
    logPrefix: string
    newDeckUnit: DeckUnitDbObject
    newUnit: UnitDbObject
    isWeather: boolean
  }): ImpactsByUnitId {
    const impacts: ImpactDbObject[] = []

    if (isWeather) {
      for (const player of game.players) {
        const round = player.rounds[game.round - 1]
        const clearWeather = !newUnit.combats || newUnit.combats.length === 0
        const isCurrentPlayer = player.user.toString() === game.turn?.toString()
        if (clearWeather) {
          EffectWeather.logger.debug(
            `${logPrefix} weather "${newUnit._id}" has no combats so clearing weathers for player "${player.user}"`
          )
          for (const weather of round.weathers) {
            impacts.push({
              unit: {
                ...weather,
                type: GameUnitType.Weather,
              },
              user: player.user,
            })
          }
          round.weathers = []
        } else if (isCurrentPlayer) {
          EffectWeather.logger.debug(`${logPrefix} adding weather "${newUnit._id}"`)
          round.weathers.push(newDeckUnit)
        }
      }
    }

    return impacts.length > 0 ? { [newDeckUnit.unit.toString()]: impacts } : {}
  }

  /**
   * Applies Weather effect to eligible units, setting their effectiveStrenth to 1. Does not effect heroes.
   *
   * @param config The configuration used to determine which units are eligible for Weather reset and how to change their effectiveStrength.
   * @param config.logPrefix The prefix to prepend to log statements.
   * @param config.weatherUnits A list of Units for the weathers effecting the row the unit under consideration is apart of.
   * @param config.weatherEffect The Effect database document for the Weather effect.
   * @param config.newDeckUnit The new DeckUnit being deployed to the battlefield.
   * @param config.rowFieldUnit The FieldUnit under consideration to be weathered.
   * @param config.rowUnit The Unit under consideration to be weathered.
   * @param config.userId The ID of the user whose unit is under consideration to be weathered.
   * @param config.currentPlayerId The ID of the user who played the newDeckUnit.
   * @returns An array of weathered impacts for the unit under consideration.
   */
  static weatherScores({
    logPrefix,
    weatherUnits,
    weatherEffect,
    newDeckUnit,
    rowFieldUnit,
    rowUnit,
    userId,
    currentPlayerId,
  }: {
    logPrefix: string
    weatherUnits: PlayerWeatherUnit[]
    weatherEffect: EffectDbObject | undefined
    newDeckUnit: DeckUnitDbObject
    rowFieldUnit: FieldUnitDbObject
    rowUnit: UnitDbObject
    userId: ObjectId
    currentPlayerId: ObjectId | undefined
  }): ImpactsByUnitId {
    const impacts: ImpactsByUnitId = {}

    if (EffectWeather.logger.isTraceEnabled()) {
      EffectWeather.logger.trace(`${logPrefix} rowUnit: "${JSON.stringify(rowUnit)}"`)
    }

    if (!rowUnit.hero && rowUnit.strength && rowUnit.strength > 1) {
      const weathersToApply = weatherUnits
        .filter((weather) => weather.unit._id.toString() !== rowFieldUnit.unit.toString())
        // put current turn player's weathers in the "back"
        // to prevent incorrectly showing a weather impact
        // which happened in a previous turn
        .sort((a, b) => {
          if (currentPlayerId && a.userId.toString() === currentPlayerId?.toString()) {
            return 1
          }
          if (currentPlayerId && b.userId.toString() === currentPlayerId?.toString()) {
            return -1
          }
          return 0
        })
      if (EffectWeather.logger.isTraceEnabled()) {
        EffectWeather.logger.trace(`${logPrefix} weathersToApply: "${JSON.stringify(weathersToApply)}"`)
      }
      let weathered = false
      for (let i = 0; i < weathersToApply.length && !weathered; i++) {
        const weather = weathersToApply[i]
        if (weatherEffect && weather && rowFieldUnit.effects) {
          weathered = true
          rowFieldUnit.effectiveStrength = 1
          EffectWeather.logger.debug(
            `${logPrefix} weathering unit "${rowUnit._id}" by "${weather.unit._id}" for an effectiveStrength of "${rowFieldUnit.effectiveStrength}".`
          )
          const reason: EffectFromUnitDbObject = {
            effect: weatherEffect._id,
            type: EffectReasonType.Unit,
            unit: weather.unit._id,
          }

          const fieldUnitEffect: FieldUnitEffectDbObject = {
            operator: EFFECT_OPERATOR.Set,
            reason,
            total: rowFieldUnit.effectiveStrength,
          }
          if (EffectWeather.logger.isTraceEnabled()) {
            EffectWeather.logger.trace(`${logPrefix} fieldUnitEffect: "${JSON.stringify(fieldUnitEffect)}"`)
          }
          rowFieldUnit.effects.push(fieldUnitEffect)

          const impactables = [newDeckUnit.unit.toString()]
          if (
            impactables.includes(weather.unit._id.toString()) &&
            currentPlayerId &&
            weather.userId.toString() === currentPlayerId.toString()
          ) {
            const impact: ImpactDbObject = {
              unit: {
                ...rowFieldUnit,
                type: GameUnitType.Field,
              },
              user: userId,
            }
            if (EffectWeather.logger.isTraceEnabled()) {
              EffectWeather.logger.trace(`${logPrefix} impact: "${JSON.stringify(impact)}"`)
            }
            impacts[weather.unit._id.toString()] = [impact]
          }
        }
      }
    } else {
      if (rowUnit.hero) {
        EffectWeather.logger.debug(
          `${logPrefix} rowUnit "${rowUnit._id}" is hero so not susceptible to weather effect.`
        )
      } else {
        EffectWeather.logger.debug(
          `${logPrefix} rowUnit "${rowUnit._id}" strength "${rowUnit.strength}" is less than "2" so not susceptible to weather effect.`
        )
      }
    }

    return impacts
  }
}
