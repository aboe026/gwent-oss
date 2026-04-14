import DeckUnitResolver from './deck-unit-resolver'
import { FieldUnitDbObject, GameUnitDbObject } from '@gwent/graphql-schema/database-typings'
import FieldUnitResolver from './field-unit-resolver'
import { GameUnit, Unit } from '@gwent/graphql-schema/resolver-typings'
import { GameUnitType } from '@gwent/graphql-schema'
import UnitResolver from './unit-resolver'
import WeatherUnitResolver from './weather-unit-resolver'

/**
 * A class to convert GameUnit database objects to their GraphQL equivalent.
 */
export default class GameUnitResolver {
  /**
   * Converts a single GameUnit database object to a single GameUnit GraphQL object.
   *
   * @param config The configuration to use when resolving the GameUnit object.
   * @param config.gameUnit The database object to resolve to its GraphQL type.
   * @param config.unit An optional pre-resolved unit. If not specified, will retreive the Unit from the database to resolve.
   * @returns The resolved GameUnit object matching its GraphQL schema definition.
   */
  static async fromObject({ gameUnit, unit }: { gameUnit: GameUnitDbObject; unit?: Unit }): Promise<GameUnit> {
    if (gameUnit.type === GameUnitType.Deck) {
      return DeckUnitResolver.fromObject({
        deckUnit: gameUnit,
        unit,
      })
    } else if (gameUnit.type === GameUnitType.Field) {
      return FieldUnitResolver.fromObject({
        fieldUnit: gameUnit as FieldUnitDbObject,
        unit,
      })
    }
    return WeatherUnitResolver.fromObject({
      weatherUnit: gameUnit,
      unit,
    })
  }

  /**
   * Converts an array of GameUnit database objects to an array of GameUnit GraphQL objects.
   *
   * @param config The configuration used to resolve the array of GameUnit.
   * @param config.gameUnits The database objects to resolve to their GraphQL types.
   * @param config.units The resolved Units for the GameUnit. If not provided, will be retrieved.
   * @returns The resolved GameUnit array matching the GraphQL schema definition.
   */
  static async fromArray({ gameUnits, units }: { gameUnits: GameUnitDbObject[]; units?: Unit[] }): Promise<GameUnit[]> {
    if (gameUnits.length === 0) {
      return []
    }

    let resolvedUnits: Unit[]
    if (units) {
      resolvedUnits = units
    } else {
      resolvedUnits = await UnitResolver.fromIds({
        ids: gameUnits.map((gameUnit) => gameUnit.unit),
      })
    }

    const resolvedGameUnits: GameUnit[] = []
    for (const gameUnit of gameUnits) {
      resolvedGameUnits.push(
        await GameUnitResolver.fromObject({
          gameUnit,
          unit: resolvedUnits.find((unit) => unit.id.toString() === gameUnit.unit.toString()),
        })
      )
    }

    return resolvedGameUnits
  }
}
