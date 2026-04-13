import { Combat, TacoUnitDbObject } from '@gwent/graphql-schema/database-typings'
import { DeckUnit, FieldUnit, TacoUnit, Unit, WeatherUnit } from '@gwent/graphql-schema/resolver-typings'
import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import FieldUnitResolver from '../../src/graphql/resolvers/types/field-unit-resolver'
import { GameUnitType } from '@gwent/graphql-schema'
import TacoUnitResolver from '../../src/graphql/resolvers/types/taco-unit-resolver'
import TestUtil from '../util/test-util'
import UnitResolver from '../../src/graphql/resolvers/types/unit-resolver'
import WeatherUnitResolver from '../../src/graphql/resolvers/types/weather-unit-resolver'

describe('taco-unit-resolver', () => {
  describe('fromObject', () => {
    it('returns DeckUnit if type is Deck', async () => {
      const unit = TestUtil.getUnit({})
      const deckUnit = TestUtil.getDbDeckUnit({
        id: unit.id,
      })
      await testFromObject({
        tacoUnit: TestUtil.getDbTacoUnit({
          ...deckUnit,
          type: GameUnitType.Deck,
        }),
        unit,
        deckUnit: TestUtil.getDeckUnitFromDbDeckUnit({
          deckUnit,
          unit,
        }),
      })
    })
    it('returns FieldUnit if type is Field', async () => {
      const unit = TestUtil.getUnit({})
      const fieldUnit = TestUtil.getDbFieldUnit({
        id: unit.id,
      })
      await testFromObject({
        tacoUnit: TestUtil.getDbTacoUnit({
          ...fieldUnit,
          row: fieldUnit.row as Combat,
          type: GameUnitType.Field,
        }),
        unit,
        fieldUnit: TestUtil.getFieldUnitFromDbFieldUnit({
          fieldUnit,
          unit,
        }),
      })
    })
    it('returns WeatherUnit if type is Weather', async () => {
      const unit = TestUtil.getUnit({})
      const weatherUnit = TestUtil.getDbWeatherUnit({
        id: unit.id,
      })
      await testFromObject({
        tacoUnit: TestUtil.getDbTacoUnit({
          ...weatherUnit,
          type: GameUnitType.Weather,
        }),
        unit,
        weatherUnit: TestUtil.getWeatherUnitFromDbWeatherUnit({
          weatherUnit,
          unit,
        }),
      })
    })
  })
  describe('fromArray', () => {
    it('returns empty array if provided one', async () => {
      await testFromArray({
        tacoUnits: [],
      })
    })
    it('returns single resolved TacoUnit without presolved unit', async () => {
      await testFromArray({
        tacoUnits: [TestUtil.getDbTacoUnit({})],
      })
    })
    it('returns single resolved TacoUnit with presolved unit', async () => {
      const unit = TestUtil.getUnit({})
      await testFromArray({
        tacoUnits: [
          TestUtil.getDbTacoUnit({
            id: unit.id,
          }),
        ],
        units: [unit],
      })
    })
    it('returns multiple resolved TacoUnits without presolved unit', async () => {
      await testFromArray({
        tacoUnits: [TestUtil.getDbTacoUnit({}), TestUtil.getDbTacoUnit({})],
      })
    })
    it('returns multiple resolved TacoUnits with presolved unit', async () => {
      const unit1 = TestUtil.getUnit({})
      const unit2 = TestUtil.getUnit({})
      await testFromArray({
        tacoUnits: [
          TestUtil.getDbTacoUnit({
            id: unit1.id,
          }),
          TestUtil.getDbTacoUnit({
            id: unit2.id,
          }),
        ],
        units: [unit1, unit2],
      })
    })
  })
})

async function testFromObject({
  tacoUnit,
  unit,
  deckUnit,
  fieldUnit,
  weatherUnit,
}: {
  tacoUnit: TacoUnitDbObject
  unit?: Unit
  deckUnit?: DeckUnit
  fieldUnit?: FieldUnit
  weatherUnit?: WeatherUnit
}) {
  const deckUnitResolverSpy = jest.spyOn(DeckUnitResolver, 'fromObject')
  if (deckUnit) {
    deckUnitResolverSpy.mockResolvedValue(deckUnit)
  }
  const fieldUnitResolverSpy = jest.spyOn(FieldUnitResolver, 'fromObject')
  if (fieldUnit) {
    fieldUnitResolverSpy.mockResolvedValue(fieldUnit)
  }
  const weatherUnitResolverSpy = jest.spyOn(WeatherUnitResolver, 'fromObject')
  if (weatherUnit) {
    weatherUnitResolverSpy.mockResolvedValue(weatherUnit)
  }

  await expect(
    TacoUnitResolver.fromObject({
      tacoUnit,
      unit,
    })
  ).resolves.toEqual(deckUnit || fieldUnit || weatherUnit)

  expect(deckUnitResolverSpy.mock.calls).toEqual(
    deckUnit
      ? [
          [
            {
              deckUnit: tacoUnit,
              unit,
            },
          ],
        ]
      : []
  )
  expect(fieldUnitResolverSpy.mock.calls).toEqual(
    fieldUnit
      ? [
          [
            {
              fieldUnit: tacoUnit,
              unit,
            },
          ],
        ]
      : []
  )
  expect(weatherUnitResolverSpy.mock.calls).toEqual(
    weatherUnit
      ? [
          [
            {
              weatherUnit: tacoUnit,
              unit,
            },
          ],
        ]
      : []
  )
}

async function testFromArray({ tacoUnits, units }: { tacoUnits: TacoUnitDbObject[]; units?: Unit[] }) {
  const resolvedUnits: Unit[] =
    units ||
    tacoUnits.map((tacoUnit) => {
      return TestUtil.getUnit({
        id: tacoUnit.unit,
      })
    })
  const resolvedTacoUnits: TacoUnit[] = []
  const unitResolverSpy = jest.spyOn(UnitResolver, 'fromIds').mockResolvedValue(resolvedUnits)
  const tacoUnitResolverSpy = jest.spyOn(TacoUnitResolver, 'fromObject')
  const tacoUnitResolverCalls: any[][] = []
  for (let i = 0; i < tacoUnits.length; i++) {
    const resolvedTacoUnit = TestUtil.getTacoUnitFromDbTacoUnit({
      tacoUnit: tacoUnits[i],
      unit: resolvedUnits[i],
    })
    tacoUnitResolverSpy.mockResolvedValueOnce(resolvedTacoUnit)
    resolvedTacoUnits.push(resolvedTacoUnit)
    tacoUnitResolverCalls.push([
      {
        tacoUnit: tacoUnits[i],
        unit: resolvedUnits[i],
      },
    ])
  }

  await expect(
    TacoUnitResolver.fromArray({
      tacoUnits,
      units,
    })
  ).resolves.toEqual(resolvedTacoUnits)

  expect(unitResolverSpy.mock.calls).toEqual(
    tacoUnits.length === 0 || units
      ? []
      : [
          [
            {
              ids: tacoUnits.map((tacoUnit) => tacoUnit.unit),
            },
          ],
        ]
  )
  expect(tacoUnitResolverSpy.mock.calls).toEqual(tacoUnitResolverCalls)
}
