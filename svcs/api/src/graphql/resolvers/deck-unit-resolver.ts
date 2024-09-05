import { DeckUnitDbObject } from '@gwent/graphql-schema/database-typings'
import { DeckUnit } from '@gwent/graphql-schema/resolver-typings'
import UnitResolver from './unit-resolver'
import { getUniqueItems } from '@gwent/utils'
import { ObjectId } from 'mongodb'
import { getLogger } from 'log4js'

export default class DeckUnitResolver {
  private static logger = getLogger('deck-unit-resolver')

  static async resolveFromObject({
    deckUnit,
    neutralStats,
  }: {
    deckUnit: DeckUnitDbObject
    neutralStats?: boolean
  }): Promise<DeckUnit> {
    const unit = await UnitResolver.resolveFromId({
      id: deckUnit.unit,
      neutralStats,
    })
    if (!unit) {
      const message = `Could not resolve unit "${deckUnit.unit}" as deckUnit.`
      DeckUnitResolver.logger.error(message)
      throw Error(message)
    }
    return {
      artStyle: deckUnit.artStyle,
      unit,
    }
  }

  static async resolveFromArray({
    deckUnits,
    neutralStats,
  }: {
    deckUnits: DeckUnitDbObject[]
    neutralStats?: boolean
  }): Promise<DeckUnit[]> {
    const unitIds = getUniqueItems<ObjectId>(deckUnits.map((deckUnit) => deckUnit.unit))
    const resolvedUnits = await UnitResolver.resolveFromIds({
      ids: unitIds,
      neutralStats,
    })
    return deckUnits.map((deckUnit) => {
      const unit = resolvedUnits.find((unit) => unit.id.toString() === deckUnit.unit.toString())
      if (!unit) {
        const message = `Could not resolved deck unit "${deckUnit.unit}" in array.`
        DeckUnitResolver.logger.error(message)
        throw Error(message)
      }
      return {
        artStyle: deckUnit.artStyle,
        unit,
      }
    })
  }
}
