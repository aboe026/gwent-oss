import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Combat, DeckUnitDbObject, GameDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import PresentableError from '../../../../util/presentable-error'

/**
 * A class for getting the Units for any weather units active for a specific row in a players round.
 */
export default class GetWeatherUnitsForRow {
  private static logger = getLogger('GetWeatherUnitsForRow')

  /**
   * Gets all potential Weather units for all players in a Gaem for a particular combat row.
   *
   * @param config The configuration used to get the Weather units.
   * @param config.logPrefix What to prepend log statements with.
   * @param config.combat The Combat row to get all Weathers for.
   * @param config.game The Game to get all Weathers in the specific combat row for.
   * @param config.units The Unit objects apart of the Game.
   * @returns All potential Weather units for all players in a Gaem for a particular combat row.
   */
  static getWeatherUnitsForRow({
    logPrefix,
    combat,
    game,
    units,
  }: {
    logPrefix: string
    game: GameDbObject
    combat: Combat | undefined
    units: UnitDbObject[]
  }): PlayerWeatherUnit[] {
    const weatherUnits: PlayerWeatherUnit[] = []

    if (combat) {
      const weathers: {
        player: ObjectId
        deckUnit: DeckUnitDbObject
      }[] = []

      for (const player of game.players) {
        const round = player.rounds[game.round - 1]
        if (round) {
          for (const weather of round.weathers) {
            weathers.push({
              player: player.user,
              deckUnit: weather,
            })
          }
        }
      }

      for (const weather of weathers) {
        const matchingUnit = units.find((unit) => unit._id.toString() === weather.deckUnit.unit.toString())
        if (!matchingUnit) {
          const message = `Could not find weather Unit with ID "${weather.deckUnit.unit}"`
          GetWeatherUnitsForRow.logger.error(`${logPrefix} failed: ${message}`)
          throw new PresentableError(`${message}.`)
        }

        if (matchingUnit.combats && matchingUnit.combats.includes(combat)) {
          weatherUnits.push({
            player: weather.player,
            unit: matchingUnit,
          })
        }
      }
    }

    return weatherUnits
  }
}

export interface PlayerWeatherUnit {
  player: ObjectId // TODO: change to userId?
  unit: UnitDbObject
}
