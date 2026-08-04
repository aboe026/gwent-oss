import { ObjectId } from 'mongodb'

import TestUtil from '../util/test-util'
import { Unit, WeatherUnit } from '@gwent-oss/graphql-schema/resolver-typings'
import UnitResolver from '../../src/graphql/resolvers/types/unit-resolver'
import { WeatherUnitDbObject } from '@gwent-oss/graphql-schema/database-typings'
import WeatherUnitResolver from '../../src/graphql/resolvers/types/weather-unit-resolver'

describe('weather-unit-resolver', () => {
  describe('fromObject', () => {
    it('does not call to UnitResolver if unit provided', async () => {
      const unit = TestUtil.getUnit({})
      await testResolveFromObject({
        weatherUnit: {
          artStyle: 1,
          unit: new ObjectId(unit.id),
        },
        unit,
      })
    })
    it('calls to UnitResolver if unit not provided', async () => {
      const unitId = new ObjectId()
      await testResolveFromObject({
        weatherUnit: {
          artStyle: 1,
          unit: unitId,
        },
        unitResolverResponse: TestUtil.getUnit({
          id: unitId,
        }),
      })
    })
  })
  describe('fromArray', () => {
    it('returns empty array if provided empty array', async () => {
      await testResolveFromArray({
        weatherUnits: [],
      })
    })
    it('calls to resolvers with unique unit ids if provided', async () => {
      const weatherUnit = TestUtil.getDbWeatherUnit({})
      await testResolveFromArray({
        weatherUnits: [weatherUnit],
        resolvedUnits: [
          TestUtil.getUnit({
            id: weatherUnit.unit,
          }),
        ],
        unitResolverCalls: [
          [
            {
              ids: [weatherUnit.unit],
            },
          ],
        ],
      })
    })
  })
})

async function testResolveFromObject({
  weatherUnit,
  unit,
  unitResolverResponse,
}: {
  weatherUnit: WeatherUnitDbObject
  unit?: Unit
  unitResolverResponse?: Unit
}) {
  const resolvedUnit = unit || unitResolverResponse
  if (!resolvedUnit) {
    throw Error(`No resolved unit for weatherUnit "${JSON.stringify(weatherUnit)}"`)
  }
  const resolvedWeatherUnit: WeatherUnit = {
    artStyle: weatherUnit.artStyle,
    unit: resolvedUnit,
    __typename: 'WeatherUnit',
  }
  const unitResolverSpy = jest.spyOn(UnitResolver, 'fromId')
  if (unitResolverResponse) {
    unitResolverSpy.mockResolvedValue(unitResolverResponse)
  }

  await expect(
    WeatherUnitResolver.fromObject({
      weatherUnit,
      unit,
    })
  ).resolves.toEqual(resolvedWeatherUnit)

  expect(unitResolverSpy.mock.calls).toEqual(
    unit
      ? []
      : [
          [
            {
              id: weatherUnit.unit,
            },
          ],
        ]
  )
}

async function testResolveFromArray({
  weatherUnits = [],
  resolvedUnits = [],
  unitResolverCalls = [],
}: {
  weatherUnits?: WeatherUnitDbObject[]
  resolvedUnits?: Unit[]
  unitResolverCalls?: any[][]
}) {
  const unitResolverSpy = jest.spyOn(UnitResolver, 'fromIds').mockResolvedValue(resolvedUnits)

  await expect(
    WeatherUnitResolver.fromArray({
      weatherUnits,
    })
  ).resolves.toEqual(
    weatherUnits?.map((weatherUnit) => {
      const unit = resolvedUnits.find((unit) => unit.id.toString() === weatherUnit.unit.toString())
      if (!unit) {
        throw Error(`Could not find unit "${weatherUnit.unit}" for WeatherUnit "${JSON.stringify(weatherUnit)}"`)
      }
      const resolvedWeatherUnit: WeatherUnit = {
        artStyle: weatherUnit.artStyle,
        unit,
        __typename: 'WeatherUnit',
      }
      return resolvedWeatherUnit
    })
  )

  expect(unitResolverSpy.mock.calls).toEqual(unitResolverCalls)
}
