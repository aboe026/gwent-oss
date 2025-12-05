import { getLogger } from 'log4js'

import {
  DeckUnitDbObject,
  GameDbObject,
  GamePlayerDbObject,
  ImpactDbObject,
  PlayerCombatRowDbObject,
} from '@gwent/graphql-schema/database-typings'
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
   * @param config.targetId The ID of the battlefield unit to replace with the Decoy.
   * @throws {PresentableError} If problem decoying target.
   * @returns If the unit being played is a Decoy, the unit removed from the battlefield and its Impact, otherwise undefined.
   */
  static decoyFromBattlefield({
    game,
    logPrefix,
    newDeckUnit,
    targetId,
  }: {
    game: GameDbObject
    logPrefix: string
    newDeckUnit: DeckUnitDbObject
    targetId: string | undefined | null
  }): PotentialDecoy {
    const impacts: ImpactDbObject[] = []
    let deckUnitAddedToHand: DeckUnitDbObject | undefined = undefined

    if (targetId) {
      const player = game.players.find((player) => player.user.toString() === game.turn?.toString())
      if (!player) {
        const message = `Could not find player "${game.turn}" in game "${game._id}"`
        this.logger.error(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
      const round = player?.rounds[game.round - 1]
      const rows = [round?.close, round?.ranged, round?.siege]
      for (let i = 0; i < rows.length && impacts.length === 0; i++) {
        const impact = EffectDecoy.decoyFromRow({
          player,
          row: rows[i],
          targetId,
        })
        if (impact) {
          impacts.push(impact)
        }
      }

      if (impacts.length === 0) {
        const message = `Decoy "${newDeckUnit.unit}" did not get applied for unit "${targetId}"`
        this.logger.error(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
      if (impacts.length > 1) {
        const message = `Decoy "${newDeckUnit.unit}" impacted more than "${targetId}"`
        this.logger.error(`${logPrefix} failed: ${message}: "${JSON.stringify(impacts)}"`)
        throw new PresentableError(message)
      }

      deckUnitAddedToHand = impacts[0].unit
    }

    return {
      deckUnitAddedToHand,
      impacts: {
        [newDeckUnit.unit.toString()]: impacts,
      },
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
        if (player.deck.hand) {
          player.deck.hand.push(target)
        }
        impact = {
          unit: target,
          user: player.user,
        }
      }
    }

    return impact
  }
}

interface PotentialDecoy {
  deckUnitAddedToHand: DeckUnitDbObject | undefined
  impacts: ImpactsByUnitId
}
