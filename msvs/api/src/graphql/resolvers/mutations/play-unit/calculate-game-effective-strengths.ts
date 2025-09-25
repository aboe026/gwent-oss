import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { addListsToMap } from '@gwent/utils'
import {
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  PlayerCombatRowDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import EffectBond from './effect-bond'
import EffectMorale from './effect-morale'
import GetEffectWithKey from './get-effect-with-key'
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
    const bonds: ImpactsByUnitId = {}
    const morales: ImpactsByUnitId = {}

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

    for (const player of game.players) {
      const round = player.rounds[game.round - 1]
      for (const row of [round.close, round.ranged, round.siege]) {
        const { bonds: rowBonds, morales: rowMorales } =
          CalculateGameEffectiveStrengths.calculateEffectiveStrengthsForRow({
            row,
            units,
            logPrefix,
            moraleEffect,
            bondEffect,
            newDeckUnit,
            musteredUnitIds,
            transformedUnitIds,
            userId: player.user,
            currentPlayerId: game.turn,
          })
        addListsToMap({
          baseMap: bonds,
          newLists: rowBonds,
        })
        addListsToMap({
          baseMap: morales,
          newLists: rowMorales,
        })
      }
    }

    return {
      bonds,
      morales,
    }
  }

  /**
   * Calculates the effective strength for all units in a combat row.
   *
   * @param config The configuration used to determine effective strengths for the units in the combat row.
   * @param config.row The combat row contianing the units to calculate effective strengths for.
   * @param config.units All the database Unit objects present in the round for the game.
   * @param config.logPrefix What to prepend log statements with.
   * @param config.moraleEffect The Effect database document for the Morale effect.
   * @param config.bondEffect The Effect database document for the Bond effect.
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
    moraleEffect,
    bondEffect,
    newDeckUnit,
    musteredUnitIds,
    transformedUnitIds,
    userId,
    currentPlayerId,
  }: {
    row: PlayerCombatRowDbObject
    units: UnitDbObject[]
    logPrefix: string
    moraleEffect: EffectDbObject | undefined
    bondEffect: EffectDbObject | undefined
    newDeckUnit: DeckUnitDbObject
    musteredUnitIds: string[]
    transformedUnitIds: string[]
    userId: ObjectId
    currentPlayerId: ObjectId | undefined
  }): StrengthImpacts {
    const bonds: ImpactsByUnitId = {}
    const morales: ImpactsByUnitId = {}

    const rowDbUnits: UnitDbObject[] = []
    for (const rowUnit of row.units) {
      const matchingUnit = units.find((unit) => unit._id.toString() === rowUnit.unit.toString())
      if (matchingUnit) {
        rowDbUnits.push(matchingUnit)
      } else {
        const message = `Could not find Unit with ID "${rowUnit.unit}"`
        CalculateGameEffectiveStrengths.logger.error(`${logPrefix} failed: ${message}`)
        throw new PresentableError(`${message}.`)
      }
    }

    const moraleIdsInRow = EffectMorale.getUnitsWithMorale({
      logPrefix,
      moraleEffect,
      units: rowDbUnits,
    })

    for (const rowGameUnit of row.units) {
      const rowUnit = units.find((unit) => unit._id.toString() === rowGameUnit.unit.toString())
      if (rowUnit && rowUnit.strength !== undefined && rowUnit.strength !== null) {
        const bondIdsInRow = EffectBond.getUnitsWithBond({
          bondEffect,
          logPrefix,
          units: rowDbUnits,
          unitName: rowUnit.name,
        })
        rowGameUnit.effectiveStrength = rowUnit.strength
        rowGameUnit.effects = []

        addListsToMap({
          baseMap: bonds,
          newLists: EffectBond.applyBonds({
            logPrefix,
            bondEffect,
            unitIdsWithBondInRow: bondIdsInRow,
            newDeckUnit,
            musteredUnitIds,
            transformedUnitIds,
            rowGameUnit,
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
            rowGameUnit,
            rowUnit,
            units,
            userId,
            currentPlayerId,
          }),
        })
      }
    }

    return {
      bonds,
      morales,
    }
  }
}

export interface StrengthImpacts {
  morales: ImpactsByUnitId
  bonds: ImpactsByUnitId
}
