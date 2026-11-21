import { getLogger } from 'log4js'

import {
  Combat,
  FactionKey,
  GameDbObject,
  MoveFactionDbObject,
  UnitDbObject,
} from '@gwent-oss/graphql-schema/database-typings'
import FactionStore from '../../../../database/stores/faction-store'
import { GameUnitType, MoveType } from '@gwent-oss/graphql-schema'
import { getRandomItem } from '@gwent-oss/utils'
import getRoundUnits from '../util/get-round-units'
import UpdateHistory from '../util/update-history'

/**
 * A class to handle the ability of the Monsters faction.
 */
export default class FactionMonstersAbility {
  private static logger = getLogger('FactionMonstersAbility')

  /**
   * If applicable, trigger the faction ability for Monsters and preserve a random unit on the battlefield for the next round.
   *
   * @param config The configuration used to attempt the faction ability.
   * @param config.game The game the faction ability attempt is being made for.
   * @param config.logPrefix What to prepend log statements with.
   *
   * @returns An array of UnitDbObjects that were preserved due to the Monsters faction Ability.
   */
  static async attemptAbility({ game, logPrefix }: { game: GameDbObject; logPrefix: string }): Promise<UnitDbObject[]> {
    const preservedUnits: UnitDbObject[] = []
    const monsters = await FactionStore.getByKey({
      key: FactionKey.Monsters,
      logPrefix,
    })

    for (const player of game.players) {
      const deck = player.deck.from
      if (!deck) {
        const message = `Could not get deck for player "${player.user}"`
        FactionMonstersAbility.logger.error(`${logPrefix} failed: ${message}: "${JSON.stringify(player)}"`)
        throw Error(`${message}.`)
      }
      if (deck.faction.toString() === monsters._id.toString()) {
        FactionMonstersAbility.logger.debug(
          `${logPrefix} player "${player.user}" has monsters faction "${monsters._id}", checking if any units from previous round to carry over to new round`
        )
        const factionMove: MoveFactionDbObject = {
          created: new Date(),
          faction: monsters._id,
          type: MoveType.Faction,
          impacts: [],
        }
        const previousRoundUnits = await getRoundUnits({
          game,
          playerId: player.user,
          round: game.round - 2,
          heroes: false,
          specials: false,
        })
        if (FactionMonstersAbility.logger.isTraceEnabled()) {
          FactionMonstersAbility.logger.trace(
            `previousRoundUnits for player "${player.user}": "${JSON.stringify(previousRoundUnits)}"`
          )
        }
        if (previousRoundUnits.length > 0) {
          const randomUnit = getRandomItem({
            items: previousRoundUnits,
          })

          FactionMonstersAbility.logger.debug(
            `${logPrefix} preserving unit "${randomUnit._id}" on battlefield for player "${player.user}".`
          )
          const previousRound = player.rounds[game.round - 2]
          const randomGameUnit = [
            ...previousRound.close.units,
            ...previousRound.ranged.units,
            ...previousRound.siege.units,
          ].find((unit) => unit.unit.toString() === randomUnit._id.toString())
          if (!randomGameUnit) {
            const message = `Could not get game unit for random unit "${randomUnit._id}" from previous game units for player "${player.user}"`
            FactionMonstersAbility.logger.error(`${logPrefix} failed: ${message}: "${JSON.stringify(player)}"`)
            throw Error(`${message}.`)
          }

          const currentRound = player.rounds[game.round - 1]
          if (randomGameUnit.row === Combat.Close) {
            currentRound.close.units.push(randomGameUnit)
          }
          if (randomGameUnit.row === Combat.Ranged) {
            currentRound.ranged.units.push(randomGameUnit)
          }
          if (randomGameUnit.row === Combat.Siege) {
            currentRound.siege.units.push(randomGameUnit)
          }

          preservedUnits.push(randomUnit)

          factionMove.impacts?.push({
            user: player.user,
            unit: {
              ...randomGameUnit,
              type: GameUnitType.Field,
            },
          })
        } else {
          FactionMonstersAbility.logger.debug(
            `${logPrefix} player "${player.user}" does not have any eligible units to preserve on the battlefield from the previous round`
          )
        }
        UpdateHistory.addMoveToPlayer({
          game,
          logPrefix,
          playerId: player.user,
          move: factionMove,
        })
      } else {
        FactionMonstersAbility.logger.debug(
          `${logPrefix} player "${player.user}" does not have monsters faction "${monsters._id}" so not considering for monster faction ability`
        )
      }
    }

    return preservedUnits
  }
}
