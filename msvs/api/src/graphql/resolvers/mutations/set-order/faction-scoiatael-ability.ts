import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import {
  GameDbObject,
  GamePlayerDbObject,
  ImpactDbObject,
  MoveFactionDbObject,
} from '@gwent-oss/graphql-schema/database-typings'
import { MoveType } from '@gwent-oss/graphql-schema'
import UpdateHistory from '../util/update-history'

/**
 * A class to handle the ability of the Northern Realms faction.
 */
export default class FactionScoiaTaelAbility {
  private static logger = getLogger('FactionScoiaTaelAbility')

  /**
   * If applicable, trigger the faction ability for Northern Realms and move a random unit from undrawn into hand.
   *
   * @param config The configuration used to attempt the faction ability.
   * @param config.game The game the faction ability attempt is being made for.
   * @param config.logPrefix what to prepend log statements with.
   * @param config.scoiaTaelFactionId The ID of the Scoia'Tael faction.
   * @param config.scoiaTaelPlayers All players who chose a Scoia'Tael deck for the game.
   * @param config.userIdsForOrder The User IDs in turn order for the game.
   */
  static async attemptAbility({
    game,
    logPrefix,
    scoiaTaelFactionId,
    scoiaTaelPlayers,
    userIdsForOrder,
  }: {
    game: GameDbObject
    logPrefix: string
    scoiaTaelFactionId: string
    scoiaTaelPlayers: GamePlayerDbObject[]
    userIdsForOrder: string[]
  }) {
    if (scoiaTaelPlayers.length === 0) {
      FactionScoiaTaelAbility.logger.debug(
        `${logPrefix} no players with Scoia'Tael faction "${scoiaTaelFactionId}", not triggering faction ability.`
      )
    } else {
      FactionScoiaTaelAbility.logger.debug(
        `${logPrefix} found "${scoiaTaelPlayers.length}" players with Scoia'Tael faction "${scoiaTaelFactionId}", attempting faction ability.`
      )
      const impacts: ImpactDbObject[] = []
      if (scoiaTaelPlayers.length === 1) {
        for (const userIdForOrder of userIdsForOrder) {
          impacts.push({
            user: new ObjectId(userIdForOrder),
          })
        }
      } else {
        FactionScoiaTaelAbility.logger.debug(
          `${logPrefix} found "${scoiaTaelPlayers.length}" more than 1 player with Scoia'Tael faction "${scoiaTaelFactionId}", not triggering faction ability.`
        )
      }

      for (const scoiaTaelPlayer of scoiaTaelPlayers) {
        const factionMove: MoveFactionDbObject = {
          created: new Date(),
          faction: new ObjectId(scoiaTaelFactionId),
          type: MoveType.Faction,
          impacts,
        }
        UpdateHistory.addMoveToPlayer({
          game,
          logPrefix,
          playerId: scoiaTaelPlayer.user,
          move: factionMove,
        })
      }
    }
  }
}
