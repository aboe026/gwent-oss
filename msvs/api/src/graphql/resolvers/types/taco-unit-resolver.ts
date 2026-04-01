import DeckUnitResolver from './deck-unit-resolver'
import { GameUnitDbObject, TacoUnitDbObject } from '@gwent/graphql-schema/database-typings'
import GameUnitResolver from './game-unit-resolver'
import { GameUnitType } from '@gwent/graphql-schema'
import { TacoUnit, Unit } from '@gwent/graphql-schema/resolver-typings'
import UnitResolver from './unit-resolver'
import WeatherUnitResolver from './weather-unit-resolver'

/**
 * A class to convert TacoUnit database objects to their GraphQL equivalent.
 */
export default class TacoUnitResolver {
  /**
   * Converts a single TacoUnit database object to a single TacoUnit GraphQL object.
   *
   * @param config The configuration to use when resolving the TacoUnit object.
   * @param config.tacoUnit The database object to resolve to its GraphQL type.
   * @param config.unit An optional pre-resolved unit. If not specified, will retreive the Unit from the database to resolve.
   * @returns The resolved TacoUnit object matching its GraphQL schema definition.
   */
  static async fromObject({ tacoUnit, unit }: { tacoUnit: TacoUnitDbObject; unit?: Unit }): Promise<TacoUnit> {
    if (tacoUnit.type === GameUnitType.Deck) {
      return DeckUnitResolver.fromObject({
        deckUnit: tacoUnit,
        unit,
      })
    } else if (tacoUnit.type === GameUnitType.Field) {
      return GameUnitResolver.fromObject({
        gameUnit: tacoUnit as GameUnitDbObject,
        unit,
      })
    }
    return WeatherUnitResolver.fromObject({
      weatherUnit: tacoUnit,
      unit,
    })
  }

  /**
   * Converts an array of TacoUnit database objects to an array of TacoUnit GraphQL objects.
   *
   * @param config The configuration used to resolve the array of TacoUnit.
   * @param config.tacoUnits The database objects to resolve to their GraphQL types.
   * @param config.units The resolved Units for the TacoUnit. If not provided, will be retrieved.
   * @returns The resolved TacoUnit array matching the GraphQL schema definition.
   */
  static async fromArray({ tacoUnits, units }: { tacoUnits: TacoUnitDbObject[]; units?: Unit[] }): Promise<TacoUnit[]> {
    if (tacoUnits.length === 0) {
      return []
    }

    let resolvedUnits: Unit[]
    if (units) {
      resolvedUnits = units
    } else {
      resolvedUnits = await UnitResolver.fromIds({
        ids: tacoUnits.map((tacoUnit) => tacoUnit.unit),
      })
    }

    const resolvedTacoUnits: TacoUnit[] = []
    for (const tacoUnit of tacoUnits) {
      resolvedTacoUnits.push(
        await TacoUnitResolver.fromObject({
          tacoUnit,
          unit: resolvedUnits.find((unit) => unit.id.toString() === tacoUnit.unit.toString()),
        })
      )
    }

    return resolvedTacoUnits
  }
}
