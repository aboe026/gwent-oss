import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { addListsToMap } from '@gwent/utils'
import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  PlayerCombatRowDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import EffectBond from './effect-bond'
import EffectHorn from './effect-horn'
import EffectMorale from './effect-morale'
import EffectWeather from './effect-weather'
import GetEffectWithKey from './get-effect-with-key'
import GetFieldUnits from '../../util/get-field-units'
import getUnitIdsWithEffect from './get-unit-ids-with-effect'
import GetWeatherUnitsForRow, { PlayerWeatherUnit } from './get-weather-units-for-row'
import { ImpactsByUnitId } from '../../resolver-util'
import PresentableError from '../../../../util/presentable-error'

/**
 * A class for calculating the effective strength for units in the current round of a game.
 * This is a class instead of methods because Jest was not properly spying on the named export calculateEffectiveStrengthsForRow
 * function calls from the default exported function calculateEffectiveStrengths
 */
export default class CalculateGameEffectiveStrengths {
  private static logger = getLogger('CalculateGameEffectiveStrengths')

  /**
   * Set the effective strengths for all units played in the current round of a game, taking into account unit effects and leader abilities present.
   *
   * @param config The configuration used to calculate effective strengths for units.
   * @param config.game The Game to calculate effective strengths on for the active round.
   * @param config.units All the database Unit objects present in the round for the game.
   * @param config.effects All the database Effect objects for any unit effect present in the round for the game.
   * @param config.logPrefix What to prepend log statements with.
   * @param config.newDeckUnit The new unit being introduced to the battlefield.
   * @param config.musteredUnitIds A list of any unit IDs that were mustered to the battlefield by the newDeckUnit. Used to apply potential impacts to those musters.
   * @param config.transformedUnitIds A list of any unit IDs that were transformed on the battlefield by the newDeckUnit. Used to apply potential impacts to those Vildkaarls.
   * @returns Any impacts the new unit has on other units.
   */
  static calculateEffectiveStrengths({
    game,
    units,
    effects,
    logPrefix,
    newDeckUnit,
    musteredUnitIds,
    transformedUnitIds,
  }: {
    game: GameDbObject
    units: UnitDbObject[]
    effects: EffectDbObject[]
    logPrefix: string
    newDeckUnit: DeckUnitDbObject
    musteredUnitIds: string[]
    transformedUnitIds: string[]
  }): StrengthImpacts {
    const weathers: ImpactsByUnitId = {}
    const bonds: ImpactsByUnitId = {}
    const morales: ImpactsByUnitId = {}
    const horns: ImpactsByUnitId = {}

    const weatherEffect = GetEffectWithKey.getEffectWithKey({
      effectKey: EffectKey.Weather,
      effects,
      logPrefix,
    })
    const moraleEffect = GetEffectWithKey.getEffectWithKey({
      effectKey: EffectKey.Morale,
      effects,
      logPrefix,
    })
    const bondEffect = GetEffectWithKey.getEffectWithKey({
      effectKey: EffectKey.Bond,
      effects,
      logPrefix,
    })
    const hornEffect = GetEffectWithKey.getEffectWithKey({
      effectKey: EffectKey.Horn,
      effects,
      logPrefix,
    })
    const closeWeathers = GetWeatherUnitsForRow.getWeatherUnitsForRow({
      logPrefix,
      game,
      combat: Combat.Close,
      units,
    })
    const rangedWeathers = GetWeatherUnitsForRow.getWeatherUnitsForRow({
      logPrefix,
      game,
      combat: Combat.Ranged,
      units,
    })
    const siegeWeathers = GetWeatherUnitsForRow.getWeatherUnitsForRow({
      logPrefix,
      game,
      combat: Combat.Siege,
      units,
    })

    for (const player of game.players) {
      const round = player.rounds[game.round - 1]
      const close = {
        combat: Combat.Close,
        row: round.close,
        weathers: closeWeathers,
      }
      const ranged = {
        combat: Combat.Ranged,
        row: round.ranged,
        weathers: rangedWeathers,
      }
      const siege = {
        combat: Combat.Siege,
        row: round.siege,
        weathers: siegeWeathers,
      }
      for (const row of [close, ranged, siege]) {
        const {
          weathers: rowWeathers,
          bonds: rowBonds,
          horns: rowHorns,
          morales: rowMorales,
        } = CalculateGameEffectiveStrengths.calculateEffectiveStrengthsForRow({
          row: row.row,
          units,
          logPrefix,
          weatherUnits: row.weathers,
          weatherEffect,
          moraleEffect,
          bondEffect,
          hornEffect,
          newDeckUnit,
          musteredUnitIds,
          transformedUnitIds,
          userId: player.user,
          currentPlayerId: game.turn,
        })
        addListsToMap({
          baseMap: weathers,
          newLists: rowWeathers,
        })
        addListsToMap({
          baseMap: bonds,
          newLists: rowBonds,
        })
        addListsToMap({
          baseMap: morales,
          newLists: rowMorales,
        })
        addListsToMap({
          baseMap: horns,
          newLists: rowHorns,
        })
      }
    }

    return {
      weathers,
      bonds,
      morales,
      horns,
    }
  }

  /**
   * Calculates the effective strength for all units in a combat row.
   *
   * @param config The configuration used to determine effective strengths for the units in the combat row.
   * @param config.row The combat row contianing the units to calculate effective strengths for.
   * @param config.units All the database Unit objects present in the round for the game.
   * @param config.logPrefix What to prepend log statements with.
   * @param config.weatherUnits A list of Units for the weathers effecting the row the unit under consideration is apart of.
   * @param config.weatherEffect The Effect database document for the Weather effect.
   * @param config.moraleEffect The Effect database document for the Morale effect.
   * @param config.bondEffect The Effect database document for the Bond effect.
   * @param config.hornEffect The Effect database document for the Horn effect.
   * @param config.newDeckUnit The new unit being introduced to the battlefield.
   * @param config.musteredUnitIds A list of any unit IDs that were mustered to the battlefield by the newDeckUnit. Used to apply potential impacts to those musters.
   * @param config.transformedUnitIds A list of any unit IDs that were transformed on the battlefield by the newDeckUnit. Used to apply potential impacts to those Vildkaarls.
   * @param config.userId The ID of the user for the combat row.
   * @param config.currentPlayerId The ID of the current game turn user.
   * @returns Any impacts the new unit has on other units.
   */
  private static calculateEffectiveStrengthsForRow({
    row,
    units,
    logPrefix,
    weatherUnits,
    weatherEffect,
    moraleEffect,
    bondEffect,
    hornEffect,
    newDeckUnit,
    musteredUnitIds,
    transformedUnitIds,
    userId,
    currentPlayerId,
  }: {
    row: PlayerCombatRowDbObject
    units: UnitDbObject[]
    logPrefix: string
    weatherUnits: PlayerWeatherUnit[]
    weatherEffect: EffectDbObject | undefined
    moraleEffect: EffectDbObject | undefined
    bondEffect: EffectDbObject | undefined
    hornEffect: EffectDbObject | undefined
    newDeckUnit: DeckUnitDbObject
    musteredUnitIds: string[]
    transformedUnitIds: string[]
    userId: ObjectId
    currentPlayerId: ObjectId | undefined
  }): StrengthImpacts {
    const weathers: ImpactsByUnitId = {}
    const bonds: ImpactsByUnitId = {}
    const morales: ImpactsByUnitId = {}
    const horns: ImpactsByUnitId = {}

    const rowDbUnits: UnitDbObject[] = []
    const rowFieldUnits = GetFieldUnits.fromRow({
      row,
    })
    for (const rowUnit of rowFieldUnits) {
      const matchingUnit = units.find((unit) => unit._id.toString() === rowUnit.unit.toString())
      if (matchingUnit) {
        rowDbUnits.push(matchingUnit)
      } else {
        const message = `Could not find Unit with ID "${rowUnit.unit}"`
        CalculateGameEffectiveStrengths.logger.error(`${logPrefix} failed: ${message}`)
        throw new PresentableError(`${message}.`)
      }
    }

    const moraleIdsInRow = getUnitIdsWithEffect({
      effect: moraleEffect,
      units: rowDbUnits,
    })
    const hornIdsInRow = getUnitIdsWithEffect({
      effect: hornEffect,
      units: rowDbUnits,
    })

    for (const rowFieldUnit of rowFieldUnits) {
      const rowUnit = units.find((unit) => unit._id.toString() === rowFieldUnit.unit.toString())
      if (rowUnit && rowUnit.strength !== undefined && rowUnit.strength !== null) {
        const bondIdsInRow = EffectBond.getUnitsWithBond({
          bondEffect,
          logPrefix,
          units: rowDbUnits,
          unitName: rowUnit.name,
        })
        rowFieldUnit.effectiveStrength = rowUnit.strength
        rowFieldUnit.effects = []

        addListsToMap({
          baseMap: weathers,
          newLists: EffectWeather.weatherScores({
            logPrefix,
            newDeckUnit,
            rowFieldUnit,
            rowUnit,
            weatherUnits,
            userId,
            weatherEffect,
            currentPlayerId,
          }),
        })
        addListsToMap({
          baseMap: bonds,
          newLists: EffectBond.applyBonds({
            logPrefix,
            bondEffect,
            unitIdsWithBondInRow: bondIdsInRow,
            newDeckUnit,
            musteredUnitIds,
            transformedUnitIds,
            rowFieldUnit,
            rowUnit,
            units,
            userId,
            currentPlayerId,
          }),
        })

        addListsToMap({
          baseMap: morales,
          newLists: EffectMorale.applyMorales({
            logPrefix,
            moraleEffect,
            unitIdsWithMoraleInRow: moraleIdsInRow,
            newDeckUnit,
            rowFieldUnit,
            rowUnit,
            units,
            userId,
            currentPlayerId,
            transformedUnitIds,
          }),
        })

        addListsToMap({
          baseMap: horns,
          newLists: EffectHorn.applyHorn({
            logPrefix,
            hornEffect,
            unitIdsWithHornInRow: hornIdsInRow,
            newDeckUnit,
            rowFieldUnit,
            rowUnit,
            units,
            userId,
            currentPlayerId,
          }),
        })
      }
    }

    return {
      weathers,
      bonds,
      morales,
      horns,
    }
  }
}

export interface StrengthImpacts {
  weathers: ImpactsByUnitId
  morales: ImpactsByUnitId
  bonds: ImpactsByUnitId
  horns: ImpactsByUnitId
}
