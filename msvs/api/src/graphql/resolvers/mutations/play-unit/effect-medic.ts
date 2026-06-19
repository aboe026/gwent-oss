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
 * A class to modify the battlefield if a medic unit is played or reviving a unit.
 */
export default class EffectMedic {
  private static logger = getLogger('EffectAvenger')

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
