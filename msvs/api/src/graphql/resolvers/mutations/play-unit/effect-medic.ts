import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import {
  DeckUnitDbObject,
  GameDbObject,
  GameUnitDbObject,
  GameUnitOrigin,
  MoveUnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import { GameUnitType, MoveType } from '@gwent/graphql-schema'
import GetFieldUnits from '../../util/get-field-units'
import { ImpactsByUnitId } from '../../resolver-util'
import PresentableError from '../../../../util/presentable-error'
import UnitStore from '../../../../database/stores/unit-store'

/**
 * A class to modify the battlefield if a medic unit is played or a unit is being revived.
 */
export default class EffectMedic {
  private static logger = getLogger('EffectAvenger')

  /**
   * Deploys medics to the battlefield and sets it into revival state if eligible, or revives an eligible discarded unit.
   *
   * @param config The configuration used to deploy the medic or revive the discarded unit.
   * @param config.game The game the unit is being played on.
   * @param config.newDeckUnit The new DeckUnit being deployned to the field.
   * @param config.isMedic Whether or not the new unit being deployed to the field has the Medic effect.
   * @param config.isSpy Whether or not the new unit being deployed to the field has the Spy effect.
   * @param config.targetId A potential target for the new unit being deployed to the field, such as an opponent for a Spy.
   * @param config.logPrefix What to prepend log statements with.
   *
   * @returns Potential medicing unit and impacts from it.
   */
  static async deployMedicOrReviveUnit({
    game,
    newDeckUnit,
    isMedic,
    isSpy,
    targetId,
    logPrefix,
  }: {
    game: GameDbObject
    newDeckUnit: DeckUnitDbObject
    isMedic: boolean
    isSpy: boolean
    targetId: string | undefined | null
    logPrefix: string
  }): Promise<Medicing> {
    const impacts: ImpactsByUnitId = {}
    let medicingUnit: GameUnitDbObject | undefined = undefined

    const player = game.players.find((player) => player.user.toString() === game.turn?.toString())
    if (!player) {
      const message = `Could not find current game player for ${isMedic ? 'deploying medic' : 'reviving unit'} "${newDeckUnit.unit}"`
      EffectMedic.logger.error(`${logPrefix} failed: ${message}`)
      throw Error(`${message}.`)
    }

    if (player.reviving) {
      medicingUnit = EffectMedic.updateLastMoveImpactWithUnit({
        game,
        logPrefix,
        playerId: player.user,
        unitId: newDeckUnit.unit,
        // When multi-opponent games implemented, need to change this to find correct opponent the spy is originally from
        // currently this gets the opponent the revived spy is being deployed to,
        // which may not be the same as the opponent which put the spy into the current players battlefield for them to revive.
        // To adequately support multi-opponent, will need to keep "owner" on DeckUnit/FieldUnit/WeatherUnit
        // so can always know who the card came from (or maybe that's just needed for spies?)
        targetId: isSpy ? targetId : undefined,
      })
    }
    if (isMedic) {
      impacts[newDeckUnit.unit.toString()] = []

      const revivableUnits = await UnitStore.get({
        ids: player.deck.discard
          .map((discard) => discard.unit.toString())
          .filter((id) => id !== newDeckUnit.unit.toString()),
        specials: false,
        heroes: false,
      })

      player.reviving = revivableUnits.length > 0
      if (revivableUnits.length > 0) {
        impacts[newDeckUnit.unit.toString()].push({
          user: player.user,
          source: {
            origin: GameUnitOrigin.Discard,
          },
          unit: undefined, // to be filled in on following playUnit for the revived unit
        })
      }
    } else {
      player.reviving = false
    }

    return {
      impacts,
      medicingUnit,
    }
  }

  /**
   * Updates the last move for the player with the unit it is reviving to ensure history is preserved correctly.
   *
   * @param config The configuration used to update the last history Move Impact.
   * @param config.game The game containing the last move to update.
   * @param config.logPrefix What to prepend log statements with.
   * @param config.playerId The ID of the player who should have their last move impact updated.
   * @param config.unitId The ID of the unit being revived to be set as the impact of the last Move.
   * @param config.targetId The potential ID of the opponent a Spy is targeting.
   *
   * @returns The Medic on the field which has had its history move impact updated.
   */
  private static updateLastMoveImpactWithUnit({
    game,
    logPrefix,
    playerId,
    unitId,
    targetId,
  }: {
    game: GameDbObject
    logPrefix: string
    playerId: ObjectId | string
    unitId: ObjectId | string
    targetId: string | undefined | null
  }): GameUnitDbObject {
    const player = game.players.find((player) => player.user.toString() === playerId.toString())
    if (player) {
      const round = player.rounds[game.round - 1]
      const move = round.moves.at(-1)
      if (move) {
        if (move.type === MoveType.Unit) {
          const unitMove = move as MoveUnitDbObject
          if (unitMove.impacts) {
            const impact = unitMove.impacts[0]
            if (impact) {
              if (impact.unit) {
                const message = `Unit already set to "${impact.unit.unit}" for last move`
                EffectMedic.logger.error(`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`)
                throw new PresentableError(`${message}.`)
              } else {
                const fieldUnit = GetFieldUnits.getFieldUnit({
                  game,
                  unitId,
                  userId: targetId || playerId,
                })
                if (fieldUnit) {
                  impact.unit = {
                    ...fieldUnit,
                    type: GameUnitType.Field,
                  }
                  return unitMove.unit
                } else {
                  const message = `Could not find unit "${unitId}" on battlefield to update latest impact with`
                  EffectMedic.logger.error(`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`)
                  throw new PresentableError(`${message}.`)
                }
              }
            } else {
              const message = `No impact found for move to add unit to`
              EffectMedic.logger.error(`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`)
              throw new PresentableError(`${message}.`)
            }
          } else {
            const message = `No impacts found for move to add unit to`
            EffectMedic.logger.error(`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`)
            throw new PresentableError(`${message}.`)
          }
        } else {
          const message = `Invalid last move type "${move.type}", expecting "${MoveType.Unit}"`
          EffectMedic.logger.error(`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`)
          throw new PresentableError(`${message}.`)
        }
      } else {
        const message = `Could not find last move for player "${playerId}" to update impact with unit for`
        EffectMedic.logger.error(`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`)
        throw new PresentableError(`${message}.`)
      }
    } else {
      const message = `Could not find player "${playerId}" on game "${game._id}" to update impact with unit for`
      EffectMedic.logger.error(`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`)
      throw new PresentableError(`${message}.`)
    }
  }
}

export interface Medicing {
  impacts: ImpactsByUnitId
  medicingUnit: GameUnitDbObject | undefined
}
