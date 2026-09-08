import { getLogger } from 'log4js'

import {
  FactionKey,
  GameDbObject,
  GamePlayerDbObject,
  GameUnitOrigin,
  MoveFactionDbObject,
  RoundResult,
} from '@gwent-oss/graphql-schema/database-typings'
import FactionStore from '../../../../database/stores/faction-store'
import { GameUnitType, MoveType } from '@gwent-oss/graphql-schema'
import { getRandomNumber } from '@gwent-oss/utils'
import UpdateHistory from '../util/update-history'

/**
 * A class to handle the ability of the Northern Realms faction.
 */
export default class FactionNorthernRealmsAbility {
  private static logger = getLogger('FactionNorthernRealmsAbility')

  /**
   * If applicable, trigger the faction ability for Northern Realms and move a random unit from undrawn into hand.
   *
   * @param config The configuration used to attempt the faction ability.
   * @param config.game The game the faction ability attempt is being made for.
   * @param config.logPrefix what to prepend log statements with.
   */
  static async attemptAbility({ game, logPrefix }: { game: GameDbObject; logPrefix: string }) {
    const roundWinners: GamePlayerDbObject[] = []
    for (const player of game.players) {
      const round = player.rounds[game.round - 2]
      if (round.result === RoundResult.Won) {
        roundWinners.push(player)
      }
    }
    if (FactionNorthernRealmsAbility.logger.isTraceEnabled()) {
      FactionNorthernRealmsAbility.logger.trace(`${logPrefix} roundWinners: "${JSON.stringify(roundWinners)}"`)
    }
    if (roundWinners.length > 0) {
      if (roundWinners.length > 1) {
        // TODO: throw error
      }

      const roundWinner = roundWinners[0]
      if (!roundWinner.deck.from) {
        // TODO: throw error
      }
      const factions = await FactionStore.get({
        keys: [FactionKey.NorthernRealms],
      })
      if (FactionNorthernRealmsAbility.logger.isTraceEnabled()) {
        FactionNorthernRealmsAbility.logger.trace(`${logPrefix} factions: "${JSON.stringify(factions)}"`)
      }
      if (!factions) {
        // TODO: throw error
      }
      if (factions.length > 1) {
        // TODO: throw error
      }
      const northernRealmsFaction = factions[0]
      if (roundWinner.deck.from?.faction.toString() === northernRealmsFaction._id.toString()) {
        const factionMove: MoveFactionDbObject = {
          created: new Date(),
          faction: northernRealmsFaction._id,
          type: MoveType.Faction,
          impacts: [],
        }
        if (roundWinner.deck.undrawn.length > 0) {
          const index = getRandomNumber({
            min: 0,
            max: roundWinner.deck.undrawn.length,
          })
          FactionNorthernRealmsAbility.logger.trace(`${logPrefix} index: "${index}"`)
          const undrawnToDraw = roundWinner.deck.undrawn.splice(index, 1)[0]
          roundWinner.deck.hand.push(undrawnToDraw)
          FactionNorthernRealmsAbility.logger.debug(
            `${logPrefix} won round with Northern Realms faction, random undrawn "${undrawnToDraw.unit}" moved to hand.`
          )
          factionMove.impacts?.push({
            user: roundWinner.user,
            unit: {
              ...undrawnToDraw,
              type: GameUnitType.Deck,
            },
            source: {
              origin: GameUnitOrigin.Undrawn,
            },
          })
        } else {
          FactionNorthernRealmsAbility.logger.debug(
            `${logPrefix} won round with Northern Realms faction, but no units in undrawn to randomly draw`
          )
        }
        UpdateHistory.addMoveToPlayer({
          game,
          logPrefix,
          playerId: roundWinner.user,
          move: factionMove,
        })
      }
    }
  }
}
