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
import { ImpactsByUnitId } from '../../resolver-util'
import UnitStore from '../../../../database/stores/unit-store'
import { getUniqueItems } from '@gwent/utils'

/**
 * A class to transform Berserker units when Mardroeme is played.
 */
export default class EffectMardroeme {
  private static logger = getLogger('EffectMardroeme')

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
    const newUnit = battlefieldUnits.find((unit) => unit._id.toString() === newDeckUnit.unit.toString())
    if (!newUnit) {
      const message = `Could not find unit for new deck unit "${newDeckUnit.unit}".`
      EffectMardroeme.logger.error(`${logPrefix} failed: ${message}`)
      throw Error(message)
    }
    if (EffectMardroeme.logger.isTraceEnabled()) {
      EffectMardroeme.logger.trace(`${logPrefix} newUnit: "${JSON.stringify(newUnit)}"`)
    }

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
    const hasMardroemeEffect =
      mardroemeEffect &&
      newUnit.effects &&
      newUnit.effects.map((id) => id.toString()).includes(mardroemeEffect._id.toString())
    if (EffectMardroeme.logger.isTraceEnabled()) {
      EffectMardroeme.logger.trace(`${logPrefix} hasMardroemeEffect: "${hasMardroemeEffect}"`)
    }

    const player = game.players.find((player) => player.user.toString() === game.turn?.toString())
    if (hasMardroemeEffect && player && combat && berserkerEffect) {
      EffectMardroeme.logger.debug(`${logPrefix} unit "${newUnit.name}" has mardroeme effect, applying it`)
      const gameUnits = getGameUnits({
        combat,
        players: [player],
        round: game.round,
      })
      if (EffectMardroeme.logger.isTraceEnabled()) {
        EffectMardroeme.logger.trace(`${logPrefix} gameUnits: "${JSON.stringify(gameUnits)}"`)
      }

      const berserkers = EffectMardroeme.getBerserkersToTransform({
        battlefieldUnits,
        berserkerEffect,
        gameUnits,
      })

      if (berserkers.length > 0) {
        const vildkaarls = await EffectMardroeme.getVildkaarlsForTransformation({
          berserkers,
        })

        const round = player.rounds[game.round - 1]
        const transformedPairs = EffectMardroeme.replaceBerserkersWithVildkaarl({
          berserkers,
          row: combat === Combat.Close ? round.close : combat === Combat.Ranged ? round.ranged : round.siege,
          vildkaarls,
        })

        for (const transformedPair of transformedPairs) {
          impacts.push({
            unit: transformedPair.from,
            user: player.user,
          })
          transformedUnits.push(transformedPair.to)
          // TODO: treat vildkaarls as "musters" like in update-history.ts
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
    }
  }

  private static getBerserkersToTransform({
    gameUnits,
    battlefieldUnits,
    berserkerEffect,
  }: {
    gameUnits: GameUnitDbObject[]
    battlefieldUnits: UnitDbObject[]
    berserkerEffect: EffectDbObject
  }): UnitDbObject[] {
    const berserkers: UnitDbObject[] = []

    for (const gameUnit of gameUnits) {
      const unit = battlefieldUnits.find(
        (battlefieldUnit) => battlefieldUnit._id.toString() === gameUnit.unit.toString()
      )
      if (!unit) {
        throw Error(`Could not find battlefield unit for game unit "${gameUnit.unit}"`)
      }
      if (unit.effects && unit.effects.some((effect) => effect.toString() === berserkerEffect._id.toString())) {
        berserkers.push(unit)
      }
    }

    return berserkers
  }

  private static async getVildkaarlsForTransformation({
    berserkers,
  }: {
    berserkers: UnitDbObject[]
  }): Promise<UnitDbObject[]> {
    return UnitStore.get({
      names: getUniqueItems(
        berserkers.map((berserker) =>
          berserker.name === 'Young Berserker' ? 'Transformed Young Vildkaarl' : 'Transformed Vildkaarl'
        )
      ),
    })
  }

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
      if (berserker) {
        const young = berserker.name === 'Young Berserker'
        const index = young ? youngVildkaarlIndex : oldVildkaarlIndex
        const vildkaarl = young ? youngVildkaarls[youngVildkaarlIndex] : oldVildkaarls[oldVildkaarlIndex]
        if (!vildkaarl) {
          throw Error(
            `Could not find instance "${index + 1}" of "${young ? 'Transformed Young Vildkaarl' : 'Transformed Vildkaarl'}" to transform berseker "${berserker._id}" into`
          )
        }
        gameUnit.unit = vildkaarl._id
        transformations.push({
          from: {
            ...gameUnit,
            unit: berserker._id,
          },
          to: vildkaarl,
        })
        if (young) {
          youngVildkaarlIndex++
        } else {
          oldVildkaarlIndex++
        }
      }
      return gameUnit
    })

    return transformations
  }
}

export interface TransformPairs {
  from: GameUnitDbObject
  to: UnitDbObject
}

export interface Transformations {
  impacts: ImpactsByUnitId
  transformedUnits: UnitDbObject[]
}
