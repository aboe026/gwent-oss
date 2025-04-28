import { GameUnitDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import { getLogger } from 'log4js'

export default class GetStrongestNonHeroUnits {
  private static logger = getLogger('GetStrongestNonHeroUnits')

  static getStrongestNonHeroUnits({
    gameUnits,
    logPrefix,
    minimumStrength,
    units,
  }: {
    gameUnits: GameUnitDbObject[]
    logPrefix: string
    minimumStrength: number | undefined | null
    units: UnitDbObject[]
  }): GameUnitDbObject[] {
    let highestStrength = -1
    const idToUnitMap: {
      [id: string]: UnitDbObject
    } = {}
    GetStrongestNonHeroUnits.logger.trace(`${logPrefix} minimumStrength: "${minimumStrength}"`)
    for (const gameUnit of gameUnits) {
      const unit = units.find((unit) => unit._id.toString() === gameUnit.unit.toString())
      if (!unit) {
        const message = `Could not find matching unit for game unit "${gameUnit.unit}"`
        GetStrongestNonHeroUnits.logger.error(`${logPrefix} failed: ${message} in units "${JSON.stringify(units)}"`)
        throw Error(`${message}.`)
      }
      idToUnitMap[gameUnit.unit.toString()] = unit
      const strength =
        gameUnit.effectiveStrength === undefined || gameUnit.effectiveStrength === null
          ? unit.strength
          : gameUnit.effectiveStrength
      if (strength === undefined || strength === null) {
        GetStrongestNonHeroUnits.logger.trace(
          `${logPrefix} unit "${unit.name}" does not have strength, not considering for highestStrength`
        )
      } else if (unit.hero) {
        GetStrongestNonHeroUnits.logger.trace(
          `${logPrefix} unit "${unit.name}" is a hero, not considering for highestStrength`
        )
      } else if (strength <= highestStrength) {
        GetStrongestNonHeroUnits.logger.trace(
          `${logPrefix} unit "${unit.name}" strength "${strength}" is not greater than highestStrength of "${highestStrength}"`
        )
      } else if (minimumStrength !== null && minimumStrength !== undefined && strength < minimumStrength) {
        GetStrongestNonHeroUnits.logger.trace(
          `${logPrefix} unit "${unit.name}" strength "${strength}" is not greater than minimumStrength of "${minimumStrength}", not considering for highestStrength`
        )
      } else {
        GetStrongestNonHeroUnits.logger.trace(
          `${logPrefix} unit "${unit.name}" has higher strength "${strength}" than previous "${highestStrength}", setting highestStrength to it`
        )
        highestStrength = strength
      }
    }

    const strongestGameUnits: GameUnitDbObject[] = []
    if (highestStrength > -1) {
      for (const gameUnit of gameUnits) {
        const unit = idToUnitMap[gameUnit.unit.toString()]
        const strength =
          gameUnit.effectiveStrength === undefined || gameUnit.effectiveStrength === null
            ? unit.strength
            : gameUnit.effectiveStrength
        if (strength && strength === highestStrength) {
          GetStrongestNonHeroUnits.logger.trace(
            `${logPrefix} unit "${unit.name}" matches highest strength of "${highestStrength}", adding to strongestGameUnits`
          )
          strongestGameUnits.push(gameUnit)
        }
      }
    }

    if (GetStrongestNonHeroUnits.logger.isTraceEnabled()) {
      GetStrongestNonHeroUnits.logger.trace(`${logPrefix} strongestGameUnits: "${JSON.stringify(strongestGameUnits)}"`)
    }

    return strongestGameUnits
  }
}
