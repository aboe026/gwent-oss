import { Unit } from '@gwent/graphql-schema/resolver-typings'

export default function getWeatherImage(unit: Unit): string | undefined {
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
