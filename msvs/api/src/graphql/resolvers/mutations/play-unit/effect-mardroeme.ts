import { getLogger } from 'log4js'

import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  GameUnitDbObject,
  ImpactDbObject,
  PlayerCombatRowDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import GetEffectWithKey from './get-effect-with-key'
import getGameUnits from './get-game-units'
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
    const impacts: ImpactDbObject[] = []
    const transformedUnits: UnitDbObject[] = []
    const transformedGameUnits: GameUnitDbObject[] = []
    let mardroemingGameUnit: GameUnitDbObject | undefined = undefined

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
    if (player && mardroemeEffect && berserkerEffect) {
      const gameUnits = getGameUnits({
        combat,
        players: [player],
        round: game.round,
      })
      if (EffectMardroeme.logger.isTraceEnabled()) {
        EffectMardroeme.logger.trace(`${logPrefix} gameUnits: "${JSON.stringify(gameUnits)}"`)
      }
      const gameUnitIds = gameUnits.map((gameUnit) => gameUnit.unit.toString())
      const playerRowBattlefieldUnits = battlefieldUnits.filter((battlefieldUnit) =>
        gameUnitIds.includes(battlefieldUnit._id.toString())
      )
      const mardroemeUnitIds = getUnitIdsWithEffect({
        effect: mardroemeEffect,
        units: playerRowBattlefieldUnits,
      })
      if (EffectMardroeme.logger.isTraceEnabled()) {
        EffectMardroeme.logger.trace(`${logPrefix} mardroemeUnitIds: "${JSON.stringify(mardroemeUnitIds)}"`)
      }
      const berserkerUnitIds = getUnitIdsWithEffect({
        effect: berserkerEffect,
        units: playerRowBattlefieldUnits,
      })
      if (EffectMardroeme.logger.isTraceEnabled()) {
        EffectMardroeme.logger.trace(`${logPrefix} berserkerUnitIds: "${JSON.stringify(berserkerUnitIds)}"`)
      }

      if (mardroemeUnitIds.length > 0 && berserkerUnitIds.length > 0 && combat) {
        mardroemingGameUnit = EffectMardroeme.getMardroemingGameUnit({
          gameUnits,
          mardroemeUnitIds,
        })
        const berserkers = playerRowBattlefieldUnits.filter((unit) => berserkerUnitIds.includes(unit._id.toString()))
        const existingVildkaarlIds = EffectMardroeme.getExistingVildkaarlIds({
          battlefieldUnits,
          gameUnits,
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

          const newUnitImpact = mardroemeUnitIds.includes(newDeckUnit.unit.toString())

          for (const transformedPair of transformedPairs) {
            if (newUnitImpact) {
              impacts.push({
                unit: transformedPair.from,
                user: player.user,
              })
            }
            transformedUnits.push(transformedPair.unit)
            transformedGameUnits.push(transformedPair.to)
          }
        }
      }
    }

    return {
      impacts:
        impacts.length > 0
          ? {
              [newDeckUnit.unit.toString()]: impacts,
            }
          : {},
      transformedUnits,
      transformedGameUnits,
      mardroemingGameUnit,
    }
  }

  /**
   * Gets the GameUnit responsible for transforming any Berserkers. Gets most recent Mardroeming GameUnit played.
   *
   * @param config The configuration used to get the Mardroeming GameUnit.
   * @param config.gameUnits The GameUnits in the Combat row, one of which should have the Mardroeme Effect.
   * @param config.mardroemeUnitIds A list of unit IDs which have the Mardroeme Effect.
   * @returns The GameUnit used to transform Berserkers, preferring most recent one added to the battlefield.
   */
  private static getMardroemingGameUnit({
    gameUnits,
    mardroemeUnitIds,
  }: {
    gameUnits: GameUnitDbObject[]
    mardroemeUnitIds: string[]
  }): GameUnitDbObject {
    let mardroemingGameUnit: GameUnitDbObject | undefined = undefined
    for (let i = gameUnits.length - 1; i >= 0 && !mardroemingGameUnit; i--) {
      const gameUnit = gameUnits[i]
      if (mardroemeUnitIds.includes(gameUnit.unit.toString())) {
        mardroemingGameUnit = gameUnit
      }
    }
    if (!mardroemingGameUnit) {
      throw Error(`Could not find mardroeming game unit in "${JSON.stringify(gameUnits)}"`)
    }
    return mardroemingGameUnit
  }

  /**
   * Gets the Unit IDs of any Vildkaarls already on the battlefield.
   *
   * @param config The configuration used to get the existing Vildkaarl IDs.
   * @param config.gameUnits The GameUnits in the combat row.
   * @param config.battlefieldUnits The Units on the battlefield.
   * @returns The IDs of any Vildkaarls already on the battlefield.
   */
  private static getExistingVildkaarlIds({
    gameUnits,
    battlefieldUnits,
  }: {
    gameUnits: GameUnitDbObject[]
    battlefieldUnits: UnitDbObject[]
  }): string[] {
    const ids: string[] = []

    for (const gameUnit of gameUnits) {
      const unit = battlefieldUnits.find((unit) => unit._id.toString() === gameUnit.unit.toString())
      if (!unit) {
        throw Error(`Could not find game unit "${gameUnit.unit}" on battlefield`)
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

    row.units = row.units.map((gameUnit) => {
      const berserker = berserkers.find((berserker) => berserker._id.toString() === gameUnit.unit.toString())
      let unitId = gameUnit.unit
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
            ...gameUnit,
            unit: berserker._id,
          },
          to: {
            ...gameUnit,
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
        ...gameUnit,
        unit: unitId,
      }
    })

    return transformations
  }
}

export interface TransformPairs {
  from: GameUnitDbObject
  to: GameUnitDbObject
  unit: UnitDbObject
}

export interface Transformations {
  impacts: ImpactsByUnitId
  transformedUnits: UnitDbObject[]
  transformedGameUnits: GameUnitDbObject[]
  mardroemingGameUnit: GameUnitDbObject | undefined
}
