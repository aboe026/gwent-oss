import { GameUnitDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import { getLogger } from 'log4js'

/**
 * A class for retrieving the strongest non-hero Unit ids in a given list of GameUnits.
 */
export default class GetStrongestNonHeroUnitIds {
  private static logger = getLogger('GetStrongestNonHeroUnitIds')

  /**
   * Retrieves the strongest non-hero units from a list of GameUnit database documents.
   *
   * @param config The configuration used to get the strongest non-hero units.
   * @param config.gameUnits The list of GameUnit databaes documents to get the strongest non-hero units from.
   * @param config.logPrefix What to prepend to log output statements.
   * @param config.units The list of Unit database objects matching the GameUnit database objects to determine their strength.
   * @returns A list of the strongest units which are not heros.
   */
  static getStrongestNonHeroUnitIds({
    gameUnits,
    logPrefix,
    units,
  }: {
    gameUnits: GameUnitDbObject[]
    logPrefix: string
    units: UnitDbObject[]
  }): string[] {
    let highestStrength = -1
    const idToUnitMap: {
      [id: string]: UnitDbObject
    } = {}
    for (const gameUnit of gameUnits) {
      const unit = units.find((unit) => unit._id.toString() === gameUnit.unit.toString())
      if (!unit) {
        const message = `Could not find matching unit for game unit "${gameUnit.unit}"`
        GetStrongestNonHeroUnitIds.logger.error(`${logPrefix} failed: ${message} in units "${JSON.stringify(units)}"`)
        throw Error(`${message}.`)
      }
      idToUnitMap[gameUnit.unit.toString()] = unit
      const strength =
        gameUnit.effectiveStrength === undefined || gameUnit.effectiveStrength === null
          ? unit.strength
          : gameUnit.effectiveStrength
      if (strength === undefined || strength === null) {
        GetStrongestNonHeroUnitIds.logger.trace(
          `${logPrefix} unit "${unit.name}" does not have strength, not considering for highestStrength`
        )
      } else if (unit.hero) {
        GetStrongestNonHeroUnitIds.logger.trace(
          `${logPrefix} unit "${unit.name}" is a hero, not considering for highestStrength`
        )
      } else if (strength <= highestStrength) {
        GetStrongestNonHeroUnitIds.logger.trace(
          `${logPrefix} unit "${unit.name}" strength "${strength}" is not greater than highestStrength of "${highestStrength}"`
        )
      } else {
        GetStrongestNonHeroUnitIds.logger.trace(
          `${logPrefix} unit "${unit.name}" has higher strength "${strength}" than previous "${highestStrength}", setting highestStrength to it`
        )
        highestStrength = strength
      }
    }

    const strongestUnitIds: string[] = []
    if (highestStrength > -1) {
      for (const gameUnit of gameUnits) {
        const unit = idToUnitMap[gameUnit.unit.toString()]
        const strength =
          gameUnit.effectiveStrength === undefined || gameUnit.effectiveStrength === null
            ? unit.strength
            : gameUnit.effectiveStrength
        if (strength && strength === highestStrength) {
          GetStrongestNonHeroUnitIds.logger.trace(
            `${logPrefix} unit "${unit.name}" matches highest strength of "${highestStrength}", adding to strongestUnitIds`
          )
          strongestUnitIds.push(gameUnit.unit.toString())
        }
      }
    }

    if (GetStrongestNonHeroUnitIds.logger.isTraceEnabled()) {
      GetStrongestNonHeroUnitIds.logger.trace(`${logPrefix} strongestUnitIds: "${JSON.stringify(strongestUnitIds)}"`)
    }

    return strongestUnitIds
  }
}
