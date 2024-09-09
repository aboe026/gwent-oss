import { DeckUnitDbObject } from '@gwent/graphql-schema/database-typings'
import { DeckUnit, Unit } from '@gwent/graphql-schema/resolver-typings'
import UnitResolver from './unit-resolver'
import { getLogger } from 'log4js'

export default class DeckUnitResolver {
  private static logger = getLogger('deck-unit-resolver')

  static async fromObject({
    deckUnit,
    neutralStats,
    unit,
  }: {
    deckUnit: DeckUnitDbObject
    neutralStats?: boolean
    unit?: Unit
  }): Promise<DeckUnit> {
    return {
      artStyle: deckUnit.artStyle,
      unit:
        unit ||
        (await UnitResolver.fromId({
          id: deckUnit.unit,
          neutralStats,
        })),
    }
  }

  static async fromArray({
    deckUnits,
    neutralStats,
  }: {
    deckUnits: DeckUnitDbObject[]
    neutralStats?: boolean
  }): Promise<DeckUnit[]> {
    if (deckUnits.length === 0) {
      return []
    }

    const units = await UnitResolver.fromIds({
      ids: deckUnits.map((deckUnit) => deckUnit.unit),
      neutralStats,
    })

    const resolvedDeckUnits: DeckUnit[] = []
    for (const deckUnit of deckUnits) {
      resolvedDeckUnits.push(
        await DeckUnitResolver.fromObject({
          deckUnit,
          neutralStats,
          unit: units.find((unit) => unit.id.toString() === deckUnit.unit.toString()),
        })
      )
    }

    return resolvedDeckUnits
  }
}
