import { getLogger } from 'log4js'

import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  FieldUnitDbObject,
  GameDbObject,
  ImpactDbObject,
  PlayerCombatRowDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import { GameUnitType } from '@gwent/graphql-schema'
import GetEffectWithKey from './get-effect-with-key'
import GetFieldUnits from '../../util/get-field-units'
import { getUniqueItems } from '@gwent/utils'
import getUnitIdsWithEffect from './get-unit-ids-with-effect'
import { ImpactsByUnitId } from '../../resolver-util'
import UnitStore from '../../../../database/stores/unit-store'

/**
 * A class to transform Berserker units when Mardroeme is played.
 */
export default class EffectMardroeme {
  private static logger = getLogger('EffectMardroeme')

  /**
   * Transform any Berserkers into Vildkaarls if a Mardroeme effect is in their row.
   *
   * @param config The configuration used to determine the transformations to occur.
   * @param config.battlefieldUnits The units on the battlefield.
   * @param config.combat The Combat row the newDeckUnit is being deployed to.
   * @param config.effects The Effect database objects for units on the battlefield.
   * @param config.game The game the newDeckUnit is being deployed to.
   * @param config.logPrefix What log statements should be prepended with.
   * @param config.newDeckUnit The new DeckUnit being deployed to the battlefield.
   * @returns Any transformations from Berserker to Vildkaarl that occur.
   */
  static async transformBerserkers({
    battlefieldUnits,
    combat,
    effects,
    game,
    logPrefix,
    newDeckUnit,
  }: {
    battlefieldUnits: UnitDbObject[]
    combat?: Combat | null
    effects: EffectDbObject[]
    game: GameDbObject
    logPrefix: string
    newDeckUnit: DeckUnitDbObject
  }): Promise<Transformations> {
    const impacts: ImpactsByUnitId = {}
    const transformedUnits: UnitDbObject[] = []
    const transformedFieldUnits: FieldUnitDbObject[] = []
    let mardroemingFieldUnit: FieldUnitDbObject | undefined = undefined

    const mardroemeEffect = GetEffectWithKey.getEffectWithKey({
      effectKey: EffectKey.Mardroeme,
      effects,
      logPrefix,
    })
    const berserkerEffect = GetEffectWithKey.getEffectWithKey({
      effectKey: EffectKey.Berserker,
      effects,
      logPrefix,
    })
    if (EffectMardroeme.logger.isTraceEnabled()) {
      EffectMardroeme.logger.trace(`${logPrefix} mardroemeEffect: "${JSON.stringify(mardroemeEffect)}"`)
    }
    if (EffectMardroeme.logger.isTraceEnabled()) {
      EffectMardroeme.logger.trace(`${logPrefix} berserkerEffect: "${JSON.stringify(berserkerEffect)}"`)
    }
    const player = game.players.find((player) => player.user.toString() === game.turn?.toString())
    if (player && mardroemeEffect) {
      const fieldUnits = GetFieldUnits.fromRounds({
        combat,
        rounds: [player.rounds[game.round - 1]],
      })
      if (EffectMardroeme.logger.isTraceEnabled()) {
        EffectMardroeme.logger.trace(`${logPrefix} fieldUnits: "${JSON.stringify(fieldUnits)}"`)
      }
      const fieldUnitIds = fieldUnits.map((fieldUnit) => fieldUnit.unit.toString())
      const playerRowBattlefieldUnits = battlefieldUnits.filter((battlefieldUnit) =>
        fieldUnitIds.includes(battlefieldUnit._id.toString())
      )
      const mardroemeUnitIds = getUnitIdsWithEffect({
        effect: mardroemeEffect,
        units: playerRowBattlefieldUnits,
      })
      if (EffectMardroeme.logger.isTraceEnabled()) {
        EffectMardroeme.logger.trace(`${logPrefix} mardroemeUnitIds: "${JSON.stringify(mardroemeUnitIds)}"`)
      }

      if (mardroemeUnitIds.length > 0) {
        const newUnitIsMardroeming = mardroemeUnitIds.includes(newDeckUnit.unit.toString())
        const newUnitImpacts: ImpactDbObject[] = []

        const berserkerUnitIds = getUnitIdsWithEffect({
          effect: berserkerEffect,
          units: playerRowBattlefieldUnits,
        })
        if (EffectMardroeme.logger.isTraceEnabled()) {
          EffectMardroeme.logger.trace(`${logPrefix} berserkerUnitIds: "${JSON.stringify(berserkerUnitIds)}"`)
        }

        if (berserkerUnitIds.length > 0 && combat) {
          mardroemingFieldUnit = EffectMardroeme.getMardroemingFieldUnit({
            fieldUnits,
            mardroemeUnitIds,
          })
          const berserkers = playerRowBattlefieldUnits.filter((unit) => berserkerUnitIds.includes(unit._id.toString()))
          const existingVildkaarlIds = EffectMardroeme.getExistingVildkaarlIds({
            battlefieldUnits,
            fieldUnits,
          })
          const vildkaarls = await EffectMardroeme.getVildkaarlsForTransformation({
            berserkers,
            existingVildkaarlIds,
            limit: berserkers.length,
          })

          const round = player.rounds[game.round - 1]
          const transformedPairs = EffectMardroeme.replaceBerserkersWithVildkaarl({
            berserkers,
            row: combat === Combat.Close ? round.close : combat === Combat.Ranged ? round.ranged : round.siege,
            vildkaarls,
          })
          if (transformedPairs.length > 0) {
            EffectMardroeme.logger.debug(
              `${logPrefix} transformed "${JSON.stringify(transformedPairs.map((pair) => pair.to.unit))}" berserkers into vildkaarls`
            )

            for (const transformedPair of transformedPairs) {
              if (newUnitIsMardroeming) {
                newUnitImpacts.push({
                  unit: {
                    ...transformedPair.from,
                    type: GameUnitType.Field,
                  },
                  user: player.user,
                })
              }
              transformedUnits.push(transformedPair.unit)
              transformedFieldUnits.push(transformedPair.to)
            }
          }
        }
        if (newUnitIsMardroeming) {
          impacts[newDeckUnit.unit.toString()] = newUnitImpacts
        }
      }
    }

    return {
      impacts,
      transformedUnits,
      transformedFieldUnits,
      mardroemingFieldUnit,
    }
  }

  /**
   * Gets the FieldUnit responsible for transforming any Berserkers. Gets most recent Mardroeming FieldUnit played.
   *
   * @param config The configuration used to get the Mardroeming FieldUnit.
   * @param config.fieldUnits The FieldUnits in the Combat row, one of which should have the Mardroeme Effect.
   * @param config.mardroemeUnitIds A list of unit IDs which have the Mardroeme Effect.
   * @returns The FieldUnit used to transform Berserkers, preferring most recent one added to the battlefield.
   */
  private static getMardroemingFieldUnit({
    fieldUnits,
    mardroemeUnitIds,
  }: {
    fieldUnits: FieldUnitDbObject[]
    mardroemeUnitIds: string[]
  }): FieldUnitDbObject {
    let mardroemingFieldUnit: FieldUnitDbObject | undefined = undefined
    for (let i = fieldUnits.length - 1; i >= 0 && !mardroemingFieldUnit; i--) {
      const fieldUnit = fieldUnits[i]
      if (mardroemeUnitIds.includes(fieldUnit.unit.toString())) {
        mardroemingFieldUnit = fieldUnit
      }
    }
    if (!mardroemingFieldUnit) {
      throw Error(`Could not find mardroeming game unit in "${JSON.stringify(fieldUnits)}"`)
    }
    return mardroemingFieldUnit
  }

  /**
   * Gets the Unit IDs of any Vildkaarls already on the battlefield.
   *
   * @param config The configuration used to get the existing Vildkaarl IDs.
   * @param config.fieldUnits The FieldUnit in the combat row.
   * @param config.battlefieldUnits The Units on the battlefield.
   * @returns The IDs of any Vildkaarls already on the battlefield.
   */
  private static getExistingVildkaarlIds({
    fieldUnits,
    battlefieldUnits,
  }: {
    fieldUnits: FieldUnitDbObject[]
    battlefieldUnits: UnitDbObject[]
  }): string[] {
    const ids: string[] = []

    for (const fieldUnit of fieldUnits) {
      const unit = battlefieldUnits.find((unit) => unit._id.toString() === fieldUnit.unit.toString())
      if (!unit) {
        throw Error(`Could not find game unit "${fieldUnit.unit}" on battlefield`)
      }
      if (['Transformed Vildkaarl', 'Transformed Young Vildkaarl'].includes(unit.name)) {
        ids.push(unit._id.toString())
      }
    }

    return ids
  }

  /**
   * Gets Vildkaarl units which can be used to replace Berserkers during their transformation.
   *
   * @param config The configuration used to get the Vildkaarls.
   * @param config.berserkers The Berserker Unit database objects to transform.
   * @param config.existingVildkaarlIds Any Vildkaarls already on the battlefield, to be excluded to avoid duplicates.
   * @param config.limit The number of Vildkaarls to retrieve, to prevent retrieving unnecessary data.
   * @returns The Vildkaarls Units to be used to replace the Berserkers.
   */
  private static async getVildkaarlsForTransformation({
    berserkers,
    existingVildkaarlIds,
    limit,
  }: {
    berserkers: UnitDbObject[]
    existingVildkaarlIds: string[]
    limit: number
  }): Promise<UnitDbObject[]> {
    return UnitStore.get({
      names: getUniqueItems(
        berserkers.map((berserker) =>
          berserker.name === 'Young Berserker' ? 'Transformed Young Vildkaarl' : 'Transformed Vildkaarl'
        )
      ),
      ignoreIds: existingVildkaarlIds,
      limit,
    })
  }

  /**
   * Replace all the Berserkers in a battlefield row with their respective Vildkaarls.
   *
   * @param config The configuration used to replace the Berserkers with Vildkaarls.
   * @param config.row The row in the battlefield to replace Berserkers with Vildkaarls.
   * @param config.berserkers The UnitDbObject for each Berserker in the row, used to match to its respective Vildkaarl.
   * @param config.vildkaarls The UnitDbObject for each Vildkaarl to replace in the row, used to match to its respective Berserker.
   * @returns An array of Berserkers and their respective Vildkaarls they transformed into.
   */
  private static replaceBerserkersWithVildkaarl({
    row,
    berserkers,
    vildkaarls,
  }: {
    row: PlayerCombatRowDbObject
    berserkers: UnitDbObject[]
    vildkaarls: UnitDbObject[]
  }): TransformPairs[] {
    const transformations: TransformPairs[] = []
    const youngVildkaarls = vildkaarls.filter((vildkaarl) => vildkaarl.name === 'Transformed Young Vildkaarl')
    const oldVildkaarls = vildkaarls.filter((vildkaarl) => vildkaarl.name === 'Transformed Vildkaarl')
    let youngVildkaarlIndex = 0
    let oldVildkaarlIndex = 0

    row.units = row.units.map((fieldUnit) => {
      const berserker = berserkers.find((berserker) => berserker._id.toString() === fieldUnit.unit.toString())
      let unitId = fieldUnit.unit
      if (berserker) {
        const young = berserker.name === 'Young Berserker'
        const index = young ? youngVildkaarlIndex : oldVildkaarlIndex
        const vildkaarl = young ? youngVildkaarls[youngVildkaarlIndex] : oldVildkaarls[oldVildkaarlIndex]
        if (!vildkaarl) {
          throw Error(
            `Could not find instance "${index + 1}" of "${young ? 'Transformed Young Vildkaarl' : 'Transformed Vildkaarl'}" to transform berserker "${berserker._id}" into`
          )
        }
        unitId = vildkaarl._id
        transformations.push({
          from: {
            ...fieldUnit,
            unit: berserker._id,
          },
          to: {
            ...fieldUnit,
            unit: vildkaarl._id,
          },
          unit: vildkaarl,
        })
        if (young) {
          youngVildkaarlIndex++
        } else {
          oldVildkaarlIndex++
        }
      }
      return {
        ...fieldUnit,
        unit: unitId,
      }
    })

    return transformations
  }
}

export interface TransformPairs {
  from: FieldUnitDbObject
  to: FieldUnitDbObject
  unit: UnitDbObject
}

export interface Transformations {
  impacts: ImpactsByUnitId
  transformedUnits: UnitDbObject[]
  transformedFieldUnits: FieldUnitDbObject[]
  mardroemingFieldUnit: FieldUnitDbObject | undefined
}
