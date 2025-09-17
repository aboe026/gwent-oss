import getWeatherImage from '../../src/util/get-weather-image'
import { Unit } from '@gwent/graphql-schema/resolver-typings'

describe('getWeatherImage', () => {
  it('returns undefined if unit name does not match weather name', () => {
    expect(
      getWeatherImage({
        name: 'Arachas',
      } as Unit)
    ).toEqual(undefined)
  })
  it('returns frost image if name is Biting Frost', () => {
    expect(
      getWeatherImage({
        name: 'Biting Frost',
      } as Unit)
    ).toEqual('images/weather/frost.png')
  })
  it('returns sun image if name is Clear Weather', () => {
    expect(
      getWeatherImage({
        name: 'Clear Weather',
      } as Unit)
    ).toEqual('images/weather/sun.png')
  })
  it('returns fog image if name is Impenetrable Fog', () => {
    expect(
      getWeatherImage({
        name: 'Impenetrable Fog',
      } as Unit)
    ).toEqual('images/weather/fog.png')
  })
  it('returns storm image if name is Skellige Storm', () => {
    expect(
      getWeatherImage({
        name: 'Skellige Storm',
      } as Unit)
    ).toEqual('images/weather/storm.png')
  })
  it('returns rain image if name is Torrential Rain', () => {
    expect(
      getWeatherImage({
        name: 'Torrential Rain',
      } as Unit)
    ).toEqual('images/weather/rain.png')
  })
})
