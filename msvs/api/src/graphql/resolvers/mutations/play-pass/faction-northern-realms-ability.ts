import { getLogger } from 'log4js'

import { FactionKey, GameDbObject, GamePlayerDbObject, RoundResult } from '@gwent-oss/graphql-schema/database-typings'
import FactionStore from '../../../../database/stores/faction-store'
import { getRandomNumber } from '@gwent-oss/utils'

export default class FactionNorthernRealmsAbility {
  private static logger = getLogger('FactionNorthernRealmsAbility')

  static async attemptAbility({ game, logPrefix }: { game: GameDbObject; logPrefix: string }) {
    const roundWinners: GamePlayerDbObject[] = []
    for (const player of game.players) {
      const round = player.rounds[game.round - 2]
      if (round.result === RoundResult.Won) {
        roundWinners.push(player)
      }
    }
    console.log(`TEST roundWinners: "${JSON.stringify(roundWinners)}"`)
    if (FactionNorthernRealmsAbility.logger.isTraceEnabled()) {
      FactionNorthernRealmsAbility.logger.trace(`${logPrefix} roundWinners: "${JSON.stringify(roundWinners)}"`)
    }
    if (roundWinners.length > 0) {
      console.log('TEST 0')
      if (roundWinners.length > 1) {
        console.log('TEST 1')
        // TODO: throw error
      }

      const roundWinner = roundWinners[0]
      if (!roundWinner.deck.from) {
        console.log('TEST 2')
        // TODO: throw error
      }
      const factions = await FactionStore.get({
        keys: [FactionKey.NorthernRealms],
      })
      console.log(`TEST factions: "${JSON.stringify(factions)}"`)
      if (FactionNorthernRealmsAbility.logger.isTraceEnabled()) {
        FactionNorthernRealmsAbility.logger.trace(`${logPrefix} factions: "${JSON.stringify(factions)}"`)
      }
      if (!factions) {
        console.log('TEST 3')
        // TODO: throw error
      }
      if (factions.length > 1) {
        console.log('TEST 4')
        // TODO: throw error
      }
      const northernRealmsFaction = factions[0]
      if (roundWinner.deck.from?.faction.toString() === northernRealmsFaction._id.toString()) {
        console.log('TEST 5')
        if (roundWinner.deck.undrawn.length > 0) {
          console.log('TEST 6')
          const index = getRandomNumber({
            min: 0,
            max: roundWinner.deck.undrawn.length,
          })
          console.log(`TEST index: "${index}"`)
          FactionNorthernRealmsAbility.logger.trace(`${logPrefix} index: "${index}"`)
          const undrawnToDraw = roundWinner.deck.undrawn.splice(index, 1)[0]
          console.log(`TEST undrawnToDraw: "${JSON.stringify(undrawnToDraw)}"`)
          roundWinner.deck.hand.push(undrawnToDraw)
          FactionNorthernRealmsAbility.logger.debug(
            `${logPrefix} won round with Northern Realms faction, random undrawn "${undrawnToDraw.unit}" moved to hand.`
          )
        } else {
          console.log('TEST 7')
          FactionNorthernRealmsAbility.logger.debug(
            `${logPrefix} won round with Northern Realms faction, but no units in undrawn to randomly draw`
          )
        }
      }
    }
  }
}
