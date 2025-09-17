import { UnitFragment } from '@gwent/graphql-schema/apollo-typings'

/**
 * Get the path to the weather image for a Unit.
 *
 * @param unit The Unit to get the weather image for.
 * @returns The path to the image representing the weather for the Unit.
 */
export default function getWeatherImage(unit: UnitFragment): string | undefined {
  let image
  if (unit.name === 'Biting Frost') {
    image = 'frost.png'
  } else if (unit.name === 'Clear Weather') {
    image = 'sun.png'
  } else if (unit.name === 'Impenetrable Fog') {
    image = 'fog.png'
  } else if (unit.name === 'Skellige Storm') {
    image = 'storm.png'
  } else if (unit.name === 'Torrential Rain') {
    image = 'rain.png'
  }
  if (image) {
    return `images/weather/${image}`
  }
}
