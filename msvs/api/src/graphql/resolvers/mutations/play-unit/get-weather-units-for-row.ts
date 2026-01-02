import { getLogger } from 'log4js'

import { Combat, PlayerRoundDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import PresentableError from '../../../../util/presentable-error'

/**
 * A class for getting the Units for any weather units active for a specific row in a players round.
 */
export default class GetWeatherUnitsForRow {
  private static logger = getLogger('GetWeatherUnitsForRow')

  static getWeatherUnitsForRow({
    logPrefix,
    round,
    combat,
    units,
  }: {
    logPrefix: string
    round: PlayerRoundDbObject
    combat: Combat | undefined
    units: UnitDbObject[]
  }): UnitDbObject[] {
    const weatherUnits: UnitDbObject[] = []

    if (combat) {
      for (const weather of round.weathers) {
        const matchingUnit = units.find((unit) => unit._id.toString() === weather.unit.toString())
        if (!matchingUnit) {
          const message = `Could not find weather Unit with ID "${weather.unit}"`
          GetWeatherUnitsForRow.logger.error(`${logPrefix} failed: ${message}`)
          throw new PresentableError(`${message}.`)
        }

        if (matchingUnit.combats && matchingUnit.combats.includes(combat)) {
          weatherUnits.push(matchingUnit)
        }
      }
    }

    return weatherUnits
  }
}
