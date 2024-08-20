import { DeckUnitDbObject } from '@gwent/graphql-schema/database-typings'
import { DeckUnit, Unit } from '@gwent/graphql-schema/resolver-typings'
import UnitResolver from './unit-resolver'
import { getUniqueItems } from '@gwent/utils'
import { ObjectId } from 'mongodb'

export default class DeckUnitResolver {
  static async resolveFromObject({
    deckUnit,
    neutralStats,
  }: {
    deckUnit: DeckUnitDbObject
    neutralStats?: boolean
  }): Promise<DeckUnit> {
    return {
      artStyle: deckUnit.artStyle,
      unit: await UnitResolver.resolveFromId({
        id: deckUnit.unit,
        neutralStats,
      }),
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
      const unit = resolvedUnits.find((unit) => unit.id.toString() === deckUnit.unit.toString()) as Unit
      return {
        artStyle: deckUnit.artStyle,
        unit,
      }
    })
  }
}
