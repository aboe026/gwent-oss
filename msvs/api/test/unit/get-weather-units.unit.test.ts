import getWeatherUnits from '../../src/graphql/resolvers/mutations/play-unit/get-weather-units'
import TestUtil from '../util/test-util'

describe('get-weather-units', () => {
  it('returns empty array if rounds is empty array', () => {
    expect(
      getWeatherUnits({
        rounds: [],
      })
    ).toEqual([])
  })
  describe('single round', () => {
    it('returns empty array if single round without weathers', () => {
      expect(
        getWeatherUnits({
          rounds: [
            TestUtil.getDbPlayerRound({
              weathers: [],
            }),
          ],
        })
      ).toEqual([])
    })
    it('returns single weather unit from single round', () => {
      const weather = TestUtil.getDbWeatherUnit({})
      expect(
        getWeatherUnits({
          rounds: [
            TestUtil.getDbPlayerRound({
              weathers: [weather],
            }),
          ],
        })
      ).toEqual([weather])
    })
    it('returns multiple weather units from single round', () => {
      const weather1 = TestUtil.getDbWeatherUnit({})
      const weather2 = TestUtil.getDbWeatherUnit({})
      expect(
        getWeatherUnits({
          rounds: [
            TestUtil.getDbPlayerRound({
              weathers: [weather1, weather2],
            }),
          ],
        })
      ).toEqual([weather1, weather2])
    })
  })
  describe('multiple rounds', () => {
    it('returns empty array if multiple rounds without weathers', () => {
      expect(
        getWeatherUnits({
          rounds: [
            TestUtil.getDbPlayerRound({
              weathers: [],
            }),
            TestUtil.getDbPlayerRound({
              weathers: [],
            }),
            TestUtil.getDbPlayerRound({
              weathers: [],
            }),
          ],
        })
      ).toEqual([])
    })
    it('returns single weather if first round has 1', () => {
      const weather = TestUtil.getDbWeatherUnit({})
      expect(
        getWeatherUnits({
          rounds: [
            TestUtil.getDbPlayerRound({
              weathers: [weather],
            }),
            TestUtil.getDbPlayerRound({
              weathers: [],
            }),
            TestUtil.getDbPlayerRound({
              weathers: [],
            }),
          ],
        })
      ).toEqual([weather])
    })
    it('returns single weather if middle round has 1', () => {
      const weather = TestUtil.getDbWeatherUnit({})
      expect(
        getWeatherUnits({
          rounds: [
            TestUtil.getDbPlayerRound({
              weathers: [],
            }),
            TestUtil.getDbPlayerRound({
              weathers: [weather],
            }),
            TestUtil.getDbPlayerRound({
              weathers: [],
            }),
          ],
        })
      ).toEqual([weather])
    })
    it('returns single weather if last round has 1', () => {
      const weather = TestUtil.getDbWeatherUnit({})
      expect(
        getWeatherUnits({
          rounds: [
            TestUtil.getDbPlayerRound({
              weathers: [],
            }),
            TestUtil.getDbPlayerRound({
              weathers: [],
            }),
            TestUtil.getDbPlayerRound({
              weathers: [weather],
            }),
          ],
        })
      ).toEqual([weather])
    })
    it('returns multiple weather units from singles in multiple rounds', () => {
      const weather1 = TestUtil.getDbWeatherUnit({})
      const weather2 = TestUtil.getDbWeatherUnit({})
      expect(
        getWeatherUnits({
          rounds: [
            TestUtil.getDbPlayerRound({
              weathers: [weather1],
            }),
            TestUtil.getDbPlayerRound({
              weathers: [],
            }),
            TestUtil.getDbPlayerRound({
              weathers: [weather2],
            }),
          ],
        })
      ).toEqual([weather1, weather2])
    })
    it('returns multiple weather units from singles in all rounds', () => {
      const weather1 = TestUtil.getDbWeatherUnit({})
      const weather2 = TestUtil.getDbWeatherUnit({})
      const weather3 = TestUtil.getDbWeatherUnit({})
      expect(
        getWeatherUnits({
          rounds: [
            TestUtil.getDbPlayerRound({
              weathers: [weather1],
            }),
            TestUtil.getDbPlayerRound({
              weathers: [weather2],
            }),
            TestUtil.getDbPlayerRound({
              weathers: [weather3],
            }),
          ],
        })
      ).toEqual([weather1, weather2, weather3])
    })
    it('returns multiple weather units from multiples in multiple rounds', () => {
      const weather1 = TestUtil.getDbWeatherUnit({})
      const weather2 = TestUtil.getDbWeatherUnit({})
      const weather3 = TestUtil.getDbWeatherUnit({})
      const weather4 = TestUtil.getDbWeatherUnit({})
      const weather5 = TestUtil.getDbWeatherUnit({})
      expect(
        getWeatherUnits({
          rounds: [
            TestUtil.getDbPlayerRound({
              weathers: [weather1, weather2, weather3],
            }),
            TestUtil.getDbPlayerRound({
              weathers: [],
            }),
            TestUtil.getDbPlayerRound({
              weathers: [weather4, weather5],
            }),
          ],
        })
      ).toEqual([weather1, weather2, weather3, weather4, weather5])
    })
    it('returns multiple weather units from multiples in all rounds', () => {
      const weather1 = TestUtil.getDbWeatherUnit({})
      const weather2 = TestUtil.getDbWeatherUnit({})
      const weather3 = TestUtil.getDbWeatherUnit({})
      const weather4 = TestUtil.getDbWeatherUnit({})
      const weather5 = TestUtil.getDbWeatherUnit({})
      const weather6 = TestUtil.getDbWeatherUnit({})
      expect(
        getWeatherUnits({
          rounds: [
            TestUtil.getDbPlayerRound({
              weathers: [weather1, weather2],
            }),
            TestUtil.getDbPlayerRound({
              weathers: [weather3, weather4],
            }),
            TestUtil.getDbPlayerRound({
              weathers: [weather5, weather6],
            }),
          ],
        })
      ).toEqual([weather1, weather2, weather3, weather4, weather5, weather6])
    })
  })
})
