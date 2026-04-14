import { getLogger } from 'log4js'

import { FieldUnitDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * A class for retrieving the strongest non-hero Unit ids in a given list of FieldUnit.
 */
export default class GetStrongestNonHeroUnitIds {
  private static logger = getLogger('GetStrongestNonHeroUnitIds')

  /**
   * Retrieves the strongest non-hero units from a list of FieldUnit database documents.
   *
   * @param config The configuration used to get the strongest non-hero units.
   * @param config.fieldUnits The list of FieldUnit databases documents to get the strongest non-hero units from.
   * @param config.logPrefix What to prepend to log output statements.
   * @param config.units The list of Unit database objects matching the FieldUnit database objects to determine their strength.
   * @returns A list of the strongest units which are not heros.
   */
  static getStrongestNonHeroUnitIds({
    fieldUnits,
    logPrefix,
    units,
  }: {
    fieldUnits: FieldUnitDbObject[]
    logPrefix: string
    units: UnitDbObject[]
  }): string[] {
    let highestStrength = -1
    const idToUnitMap: {
      [id: string]: UnitDbObject
    } = {}
    for (const fieldUnit of fieldUnits) {
      const unit = units.find((unit) => unit._id.toString() === fieldUnit.unit.toString())
      if (!unit) {
        const message = `Could not find matching unit for FieldUnit "${fieldUnit.unit}"`
        GetStrongestNonHeroUnitIds.logger.error(`${logPrefix} failed: ${message} in units "${JSON.stringify(units)}"`)
        throw Error(`${message}.`)
      }
      idToUnitMap[fieldUnit.unit.toString()] = unit
      const strength =
        fieldUnit.effectiveStrength === undefined || fieldUnit.effectiveStrength === null
          ? unit.strength
          : fieldUnit.effectiveStrength
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
      for (const fieldUnit of fieldUnits) {
        const unit = idToUnitMap[fieldUnit.unit.toString()]
        const strength =
          fieldUnit.effectiveStrength === undefined || fieldUnit.effectiveStrength === null
            ? unit.strength
            : fieldUnit.effectiveStrength
        if (strength && strength === highestStrength) {
          GetStrongestNonHeroUnitIds.logger.trace(
            `${logPrefix} unit "${unit.name}" matches highest strength of "${highestStrength}", adding to strongestUnitIds`
          )
          strongestUnitIds.push(fieldUnit.unit.toString())
        }
      }
    }

    if (GetStrongestNonHeroUnitIds.logger.isTraceEnabled()) {
      GetStrongestNonHeroUnitIds.logger.trace(`${logPrefix} strongestUnitIds: "${JSON.stringify(strongestUnitIds)}"`)
    }

    return strongestUnitIds
  }
}
