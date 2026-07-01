import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import {
  Combat,
  EffectDbObject,
  EffectKey,
  FieldUnitDbObject,
  GameDbObject,
  GameUnitDbObject,
  GameUnitOrigin,
  ImpactDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import GetEffectWithKey from './get-effect-with-key'
import getRoundUnits from '../util/get-round-units'
import { ImpactsByUnitId } from '../../resolver-util'
import { PlayersToDeckUnitDbObjects } from '../util/players-to-deck-units'
import UnitStore from '../../../../database/stores/unit-store'

/**
 * A class to modify the battlefield if avenger units are removed from the battlefield.
 */
export default class EffectAvenger {
  private static logger = getLogger('EffectAvenger')

  /**
   * Potentially summon units if avengers are being removed from the battlefield.
   *
   * @param config The configuration used to potentially summon avengers.
   * @param config.battlefieldUnits battlefieldUnits The Unit database documents currently on the battlefield for all players.
   * @param config.effects The Effect database documents for any effect that may be present on the battlefield, including an outgoing avenger.
   * @param config.game The game which is potentially being avenged.
   * @param config.logPrefix What to prepend log output statements with.
   * @param config.removedGameUnits The GameUnits being removed from the battlefield which may potentially be avengers.
   * @returns The impacts of any units avenged.
   */
  static async avengeRemovedUnits({
    battlefieldUnits,
    effects,
    game,
    logPrefix,
    removedGameUnits,
  }: {
    battlefieldUnits: UnitDbObject[]
    effects: EffectDbObject[]
    game: GameDbObject
    logPrefix: string
    removedGameUnits: RemovedGameUnit[]
  }): Promise<Avengings> {
    const avenged: ImpactsByUnitId = {}
    const avengedUnits: UnitDbObject[] = []
    const undiscarded: PlayersToDeckUnitDbObjects = {}
    const unhanded: PlayersToDeckUnitDbObjects = {}

    const avengerEffect = GetEffectWithKey.getEffectWithKey({
      effectKey: EffectKey.Avenger,
      effects,
      logPrefix,
    })

    if (EffectAvenger.logger.isTraceEnabled()) {
      EffectAvenger.logger.trace(`${logPrefix} removedGameUnits: "${JSON.stringify(removedGameUnits)}"`)
    }
    if (avengerEffect) {
      for (const removedGameUnit of removedGameUnits) {
        const removedGameUnitId = removedGameUnit.unit?.unit
        if (removedGameUnitId) {
          const removedUnit = battlefieldUnits.find((unit) => unit._id.toString() === removedGameUnitId.toString())
          if (!removedUnit) {
            const message = `Could not find unit for removed game unit "${removedGameUnitId}"`
            EffectAvenger.logger.error(`${logPrefix} failed: ${message}`)
            throw Error(`${message}.`)
          }
          if (EffectAvenger.logger.isTraceEnabled()) {
            EffectAvenger.logger.trace(`${logPrefix} removedUnit: "${JSON.stringify(removedUnit)}"`)
          }

          const hasAvengerEffect =
            removedUnit.effects &&
            removedUnit.effects.map((effectId) => effectId.toString()).includes(avengerEffect._id.toString())
          if (EffectAvenger.logger.isTraceEnabled()) {
            EffectAvenger.logger.trace(`${logPrefix} hasAvengerEffect: "${hasAvengerEffect}"`)
          }

          if (hasAvengerEffect) {
            const avengerName = removedUnit.effectPrefix
            if (!avengerName) {
              const message = `Could not find name of unit to summon as avenger for removed game unit "${removedGameUnitId}"`
              EffectAvenger.logger.error(`${logPrefix} failed: ${message}`)
              throw Error(`${message}.`)
            }

            const playerUnits = await getRoundUnits({
              game,
              units: battlefieldUnits,
              playerId: removedGameUnit.user,
            })
            const existingAvengerUnit = playerUnits.find((unit) => unit.name === avengerName)
            if (EffectAvenger.logger.isTraceEnabled()) {
              EffectAvenger.logger.trace(`${logPrefix} existingAvengerUnit: "${JSON.stringify(existingAvengerUnit)}"`)
            }
            if (existingAvengerUnit) {
              EffectAvenger.logger.debug(
                `${logPrefix} removed unit "${removedUnit.name}" has avenger effect, but "${avengerName}" already on the battlefield`
              )
            } else {
              EffectAvenger.logger.debug(
                `${logPrefix} removed unit "${removedUnit.name}" has avenger effect, summoning "${avengerName}" to the battlefield for player "${removedGameUnit.user}"`
              )
              let origin = GameUnitOrigin.Nondeck
              const avengerUnits = await UnitStore.get({
                names: [avengerName],
              })
              if (avengerUnits.length === 0) {
                const message = `Could not find avenger unit "${avengerName}" for removed game unit "${removedGameUnitId}"`
                EffectAvenger.logger.error(`${logPrefix} failed: ${message}`)
                throw Error(`${message}.`)
              }
              if (avengerUnits.length > 1) {
                const message = `Found more than 1 avenger unit "${avengerName}" for removed game unit "${removedGameUnitId}"`
                EffectAvenger.logger.error(
                  `${logPrefix} failed: ${message}, avengerUnits: "${JSON.stringify(avengerUnits)}"`
                )
                throw Error(`${message}.`)
              }
              const avengerUnit = avengerUnits[0]

              const player = game.players.find((player) => player.user.toString() === removedGameUnit.user.toString())
              if (!player) {
                const message = `Could not find player "${removedGameUnit.user}" for removed game unit "${removedGameUnitId}"`
                EffectAvenger.logger.error(`${logPrefix} failed: ${message}`)
                throw Error(`${message}.`)
              }

              const existingHandIndex = player.deck.hand.findIndex(
                (deckUnit) => deckUnit.unit.toString() === avengerUnit._id.toString()
              )
              if (existingHandIndex >= 0) {
                origin = GameUnitOrigin.Hand
                if (!unhanded[player.user.toString()]) {
                  unhanded[player.user.toString()] = []
                }
                unhanded[player.user.toString()].push(player.deck.hand[existingHandIndex])
                player.deck.hand.splice(existingHandIndex, 1)
              } else {
                const existingDiscardIndex = player.deck.discard.findIndex(
                  (deckUnit) => deckUnit.unit.toString() === avengerUnit._id.toString()
                )
                if (existingDiscardIndex >= 0) {
                  origin = GameUnitOrigin.Discard
                  if (!undiscarded[player.user.toString()]) {
                    undiscarded[player.user.toString()] = []
                  }
                  undiscarded[player.user.toString()].push(player.deck.discard[existingDiscardIndex])
                  player.deck.discard.splice(existingDiscardIndex, 1)
                }
              }
              EffectAvenger.logger.debug(
                `${logPrefix} removed unit "${removedUnit.name}" has avenger effect, summoning "${avengerName}" to the battlefield for player "${removedGameUnit.user}" from "${origin}"`
              )

              const playerRound = player.rounds[game.round - 1]
              avengedUnits.push(avengerUnit)

              const combat = avengerUnit.combats ? avengerUnit.combats[0] : undefined
              if (!combat) {
                const message = `Could not determine combat of avenger unit "${avengerName}" for removed game unit "${removedGameUnitId}"`
                EffectAvenger.logger.error(
                  `${logPrefix} failed: ${message}, avengerUnit: "${JSON.stringify(avengerUnit)}"`
                )
                throw Error(`${message}.`)
              }
              const avengerFieldUnit: FieldUnitDbObject = {
                artStyle: 1,
                row: combat,
                unit: avengerUnit._id,
                effectiveStrength: undefined,
                effects: [],
              }
              if (combat === Combat.Close) {
                playerRound.close.units.push(avengerFieldUnit)
              } else if (combat === Combat.Ranged) {
                playerRound.ranged.units.push(avengerFieldUnit)
              } else {
                playerRound.siege.units.push(avengerFieldUnit)
              }
              const impact: ImpactDbObject = {
                user: player.user,
                source: {
                  origin,
                },
                unit: removedGameUnit.unit,
              }
              if (avenged[avengerUnit._id.toString()]) {
                avenged[avengerUnit._id.toString()].push(impact)
              } else {
                avenged[avengerUnit._id.toString()] = [impact]
              }
            }
          }
        }
      }
    }

    return {
      impacts: avenged,
      avengedUnits,
      undiscarded,
      unhanded,
    }
  }
}

export interface RemovedGameUnit {
  unit?: GameUnitDbObject
  user: ObjectId
}

export interface Avengings {
  impacts: ImpactsByUnitId
  avengedUnits: UnitDbObject[]
  undiscarded: PlayersToDeckUnitDbObjects
  unhanded: PlayersToDeckUnitDbObjects
}
