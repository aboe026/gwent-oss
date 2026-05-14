import { getLogger } from 'log4js'

import {
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  GameUnitDbObject,
  GameUnitOrigin,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import { ImpactsByUnitId } from '../../resolver-util'
import GetEffectWithKey from './get-effect-with-key'

/**
 * A class to modify the battlefield if medic unit is played.
 */
export default class EffectMedic {
  private static logger = getLogger('EffectMedic')

  static async reviveLostUnits({
    game,
    effects,
    newDeckUnit,
    logPrefix,
    isMedic,
    targetIds,
    unitsToRevive,
  }: {
    game: GameDbObject
    effects: EffectDbObject[]
    newDeckUnit: DeckUnitDbObject
    logPrefix: string
    isMedic?: boolean
    targetIds: string[] | undefined | null
    unitsToRevive: UnitDbObject[]
  }): Promise<PotentialMedics> {
    const impacts: ImpactsByUnitId = {}
    const revivals: Revival[] = []

    if (isMedic) {
      const player = game.players.find((player) => player.user.toString() === game.turn?.toString())
      if (!player) {
        const message = 'Could not find current player for medic impact'
        EffectMedic.logger.error(`${logPrefix} failed: ${message}.`)
        throw Error(message)
      }
      impacts[newDeckUnit.unit.toString()] = []
      if (targetIds) {
        const medicEffect = GetEffectWithKey.getEffectWithKey({
          effectKey: EffectKey.Medic,
          effects,
          logPrefix,
        })
        const spyEffect = GetEffectWithKey.getEffectWithKey({
          effectKey: EffectKey.Spy,
          effects,
          logPrefix,
        })
        for (const targetId of targetIds) {
          const unitToRevive = unitsToRevive.find((unit) => unit._id.toString() === targetId)
          if (!unitToRevive) {
            const message = `Could not find unit "${targetId}" for revival`
            EffectMedic.logger.error(`${logPrefix} failed: ${message}.`)
            throw Error(message)
          }
          const discardIndex = player.deck.discard.findIndex(
            (discard) => discard.unit.toString() === unitToRevive._id.toString()
          )
          const gameUnit = player.deck.discard.splice(discardIndex, 1)[0]
          if (!gameUnit) {
            const message = `Could not find game unit "${unitToRevive._id}" in discard`
            EffectMedic.logger.error(`${logPrefix} failed: ${message}.`)
            throw Error(message)
          }
          impacts[newDeckUnit.unit.toString()].push({
            user: player.user,
            source: {
              origin: GameUnitOrigin.Discard,
            },
            unit: gameUnit,
          })
          revivals.push({
            gameUnit,
            unit: unitToRevive,
            isMedic: !!(
              unitToRevive.effects &&
              unitToRevive.effects.some((effect) => effect.toString() === medicEffect?._id.toString())
            ),
            isSpy: !!(
              unitToRevive.effects &&
              unitToRevive.effects.some((effect) => effect.toString() === spyEffect?._id.toString())
            ),
          })
        }
      }
    }

    return {
      impacts,
      revivals,
    }
  }
}

export interface PotentialMedics {
  impacts: ImpactsByUnitId
  revivals: Revival[]
}

export interface Revival {
  gameUnit: GameUnitDbObject
  unit: UnitDbObject
  isMedic: boolean
  isSpy: boolean
}
