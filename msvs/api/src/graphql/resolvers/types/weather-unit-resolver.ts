import { Unit, WeatherUnit } from '@gwent/graphql-schema/resolver-typings'
import UnitResolver from './unit-resolver'
import { WeatherUnitDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * A class to convert WeatherUnit database objects to their GraphQL equivalent.
 */
export default class WeatherUnitResolver {
  /**
   * Converts a single WeatherUnit database object to a single WeatherUnit GraphQL object.
   *
   * @param config The configuration used to convert the WeatherUnit.
   * @param config.weatherUnit The WeatherUnit to convert.
   * @param config.unit The resolved Unit for the WeatherUnit. If not provided, will be retrieved.
   * @returns The resolved WeatherUnit object matching its GraphQL schema definition.
   */
  static async fromObject({
    weatherUnit,
    unit,
  }: {
    weatherUnit: WeatherUnitDbObject
    unit?: Unit
  }): Promise<WeatherUnit> {
    return {
      artStyle: weatherUnit.artStyle,
      unit:
        unit ||
        (await UnitResolver.fromId({
          id: weatherUnit.unit,
        })),
      __typename: 'WeatherUnit',
    }
  }

  /**
   * Converts an array of WeatherUnit database objects to an array of WeatherUnit GraphQL objects.
   *
   * @param config The configuration used to convert the array.
   * @param config.weatherUnits The array of WeatherUnit database objects to convert.
   * @param config.units The resolved Units for the WeatherUnits. If not provided, will be retrieved.
   * @returns The resolved WeatherUnit array matching the GraphQL schema definition.
   */
  static async fromArray({
    weatherUnits,
    units,
  }: {
    weatherUnits: WeatherUnitDbObject[]
    units?: Unit[]
  }): Promise<WeatherUnit[]> {
    if (weatherUnits.length === 0) {
      return []
    }

    const resolvedUnits =
      units ||
      (await UnitResolver.fromIds({
        ids: weatherUnits.map((weatherUnit) => weatherUnit.unit),
      }))

    const resolvedWeatherUnits: WeatherUnit[] = []
    for (const weatherUnit of weatherUnits) {
      resolvedWeatherUnits.push(
        await WeatherUnitResolver.fromObject({
          weatherUnit,
          unit: resolvedUnits.find((unit) => unit.id.toString() === weatherUnit.unit.toString()),
        })
      )
    }

    return resolvedWeatherUnits
  }
}
