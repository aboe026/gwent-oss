import { DeckUnitDbObject } from '@gwent/graphql-schema/database-typings'
import { DeckUnit, Unit } from '@gwent/graphql-schema/resolver-typings'
import UnitResolver from './unit-resolver'
import { getLogger } from 'log4js'

export default class DeckUnitResolver {
  private static logger = getLogger('deck-unit-resolver')

  static async resolveFromObject({
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
        (await UnitResolver.resolveFromId({
          id: deckUnit.unit,
          neutralStats,
        })),
    }
  }

  static async resolveFromArray({
    deckUnits,
    neutralStats,
  }: {
    deckUnits: DeckUnitDbObject[]
    neutralStats?: boolean
  }): Promise<DeckUnit[]> {
    const units =
      deckUnits.length === 0
        ? []
        : await UnitResolver.resolveFromIds({
            ids: deckUnits.map((deckUnit) => deckUnit.unit),
            neutralStats,
          })
    const resolvedDeckUnits: DeckUnit[] = []
    for (const deckUnit of deckUnits) {
      resolvedDeckUnits.push(
        await DeckUnitResolver.resolveFromObject({
          deckUnit,
          neutralStats,
          unit: units.find((unit) => unit.id.toString() === deckUnit.unit.toString()),
        })
      )
    }
    return resolvedDeckUnits
  }
}
