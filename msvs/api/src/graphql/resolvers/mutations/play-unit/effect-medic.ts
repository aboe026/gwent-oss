import { getLogger } from 'log4js'

import { DeckUnitDbObject, GameDbObject, GameUnitOrigin } from '@gwent/graphql-schema/database-typings'
import { ImpactsByUnitId } from '../../resolver-util'
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
    logPrefix,
  }: {
    game: GameDbObject
    newDeckUnit: DeckUnitDbObject
    isMedic: boolean
    logPrefix: string
  }): Promise<Medicing> {
    const impacts: ImpactsByUnitId = {}

    const player = game.players.find((player) => player.user.toString() === game.turn?.toString())
    if (!player) {
      const message = `Could not find current game player for ${isMedic ? 'deploying medic' : 'reviving unit'} "${newDeckUnit.unit}"`
      EffectMedic.logger.error(`${logPrefix} failed: ${message}`)
      throw Error(`${message}.`)
    }
    const revived = player.reviving

    if (isMedic) {
      impacts[newDeckUnit.unit.toString()] = []

      const revivableUnits = await UnitStore.get({
        ids: player.deck.discard.map((discard) => discard.unit),
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
    } else if (revived) {
      // player reviving unit which is not medic, so done reviving
      player.reviving = false
    }

    return {
      impacts,
      revived,
    }
  }
}

export interface Medicing {
  impacts: ImpactsByUnitId
  revived: boolean
}
