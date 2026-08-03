import { PlayerRoundDbObject, WeatherUnitDbObject } from '@gwent-oss/graphql-schema/database-typings'

/**
 * Retrieve all the WeatherUnit database documents that are currently weathering the battlefield from the given players in a game.
 *
 * @param config The configuration used to get all WeatherUnit database documents.
 * @param config.rounds The Rounds of Game Players to get WeatherUnits for.
 * @returns A list of all WeatherUnit database objects which are currently weathering the battlefield for the given players in a game.
 */
export default function getWeatherUnits({ rounds }: { rounds: PlayerRoundDbObject[] }): WeatherUnitDbObject[] {
  const weatherUnits: WeatherUnitDbObject[] = []

  for (const round of rounds) {
    weatherUnits.push(...round.weathers)
  }

  return weatherUnits
}
