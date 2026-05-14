import { getLogger } from 'log4js'

import {
  Combat,
  DeckUnitDbObject,
  GameDbObject,
  GamePlayerDbObject,
  ImpactDbObject,
  PlayerCombatRowDbObject,
} from '@gwent/graphql-schema/database-typings'
import { GameUnitType } from '@gwent/graphql-schema'
import { ImpactsByUnitId } from '../../resolver-util'
import PresentableError from '../../../../util/presentable-error'

/**
 * A class to modify the battlefield if a decoy unit is played.
 */
export default class EffectDecoy {
  private static logger = getLogger('EffectDecoy')

  /**
   * Switch a unit on the battlefield with a Decoy unit.
   *
   * @param config The configuration used to decoy a unit from the battlefield.
   * @param config.game The game the decoy is being made on.
   * @param config.logPrefix What to prepend log statements with.
   * @param config.newDeckUnit The Decoy unit being played.
   * @param config.combat The combat row the new unit, and in effect the target, are in.
   * @param config.targetIds An array containing the ID of the battlefield unit to replace with the Decoy.
   * @param config.isDecoy Whether or not the new unit being played has the Decoy effect.
   * @throws {PresentableError} If problem decoying target.
   * @returns If the unit being played is a Decoy, the unit removed from the battlefield and its Impact, otherwise undefined.
   */
  static decoyFromBattlefield({
    game,
    logPrefix,
    newDeckUnit,
    combat,
    targetIds,
    isDecoy,
  }: {
    game: GameDbObject
    logPrefix: string
    newDeckUnit: DeckUnitDbObject
    combat: Combat | null | undefined
    targetIds: string[] | undefined | null
    isDecoy: boolean
  }): PotentialDecoy {
    const impacts: ImpactsByUnitId = {}
    let deckUnitAddedToHand: DeckUnitDbObject | undefined = undefined

    if (isDecoy && targetIds && targetIds[0] && combat) {
      const targetId = targetIds[0]
      impacts[newDeckUnit.unit.toString()] = []
      const player = game.players.find((player) => player.user.toString() === game.turn?.toString())
      if (!player) {
        const message = `Could not find player "${game.turn}" in game "${game._id}"`
        this.logger.error(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
      const round = player?.rounds[game.round - 1]
      const row = combat === Combat.Close ? round.close : combat === Combat.Ranged ? round.ranged : round.siege
      const impact = EffectDecoy.decoyFromRow({
        player,
        row,
        targetId,
      })

      if (impact) {
        impacts[newDeckUnit.unit.toString()].push(impact)
        deckUnitAddedToHand = impact.unit
      } else {
        const message = `Decoy "${newDeckUnit.unit}" did not get applied for unit "${targetId}"`
        this.logger.error(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
    }

    return {
      deckUnitAddedToHand,
      impacts,
    }
  }

  /**
   * Replace a unit on the battlefield with a Decoy, taking the unit into the players hand.
   *
   * @param config The configuration used to decoy the unit from the battlefield.
   * @param config.row The row on the battlefield potentially containing the unit to Decoy.
   * @param config.targetId The ID of the battlefield unit to Decoy.
   * @param config.player The Player on the game being effected by the Decoy.
   * @returns The Impact if the target exists in the row, otherwise undefined.
   */
  private static decoyFromRow({
    row,
    targetId,
    player,
  }: {
    row: PlayerCombatRowDbObject | undefined
    targetId: string
    player: GamePlayerDbObject
  }): ImpactDbObject | undefined {
    let impact: ImpactDbObject | undefined = undefined
    if (row) {
      const targetIndex = row.units.findIndex((rowUnit) => rowUnit.unit.toString() === targetId)
      if (targetIndex >= 0) {
        const target = row.units.splice(targetIndex, 1)[0]
        player.deck.hand.push(target)
        impact = {
          unit: {
            ...target,
            type: GameUnitType.Field,
          },
          user: player.user,
        }
      }
    }

    return impact
  }
}

export interface PotentialDecoy {
  deckUnitAddedToHand: DeckUnitDbObject | undefined
  impacts: ImpactsByUnitId
}
