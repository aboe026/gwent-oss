import { DeckUnit, Unit } from '@gwent/graphql-schema/resolver-typings'
import { DeckUnitDbObject } from '@gwent/graphql-schema/database-typings'
import UnitResolver from './unit-resolver'

/**
 * A class to convert DeckUnit database objects to their GraphQL equivalent.
 */
export default class DeckUnitResolver {
  /**
   * Converts a single DeckUnit database object to a single DeckUnit GraphQL object.
   *
   * @param config The configuration used to convert the DeckUnit.
   * @param config.deckUnit The DeckUnit to convert.
   * @param config.unit The resolved Unit for the DeckUnit. If not provided, will be retrieved.
   * @returns The resolved DeckUnit object matching its GraphQL schema definition.
   */
  static async fromObject({ deckUnit, unit }: { deckUnit: DeckUnitDbObject; unit?: Unit }): Promise<DeckUnit> {
    return {
      artStyle: deckUnit.artStyle,
      unit:
        unit ||
        (await UnitResolver.fromId({
          id: deckUnit.unit,
        })),
    }
  }

  /**
   * Converts an array of DeckUnit database objects to an array of DeckUnit GraphQL objects.
   *
   * @param config The configuration used to convert the array.
   * @param config.deckUnits The array of DeckUnit database objects to convert.
   * @returns The resolved DeckUnit array matching the GraphQL schema definition.
   */
  static async fromArray({ deckUnits }: { deckUnits: DeckUnitDbObject[] }): Promise<DeckUnit[]> {
    // TODO: allow for passing Units in for "preloaded" weather
    if (deckUnits.length === 0) {
      return []
    }

    const units = await UnitResolver.fromIds({
      ids: deckUnits.map((deckUnit) => deckUnit.unit),
    })

    const resolvedDeckUnits: DeckUnit[] = []
    for (const deckUnit of deckUnits) {
      resolvedDeckUnits.push(
        await DeckUnitResolver.fromObject({
          deckUnit,
          unit: units.find((unit) => unit.id.toString() === deckUnit.unit.toString()),
        })
      )
    }

    return resolvedDeckUnits
  }
}
