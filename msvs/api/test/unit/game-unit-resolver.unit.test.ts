import { Combat, GameUnitDbObject } from '@gwent/graphql-schema/database-typings'
import { DeckUnit, FieldUnit, GameUnit, Unit, WeatherUnit } from '@gwent/graphql-schema/resolver-typings'
import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import FieldUnitResolver from '../../src/graphql/resolvers/types/field-unit-resolver'
import { GameUnitType } from '@gwent/graphql-schema'
import GameUnitResolver from '../../src/graphql/resolvers/types/game-unit-resolver'
import TestUtil from '../util/test-util'
import UnitResolver from '../../src/graphql/resolvers/types/unit-resolver'
import WeatherUnitResolver from '../../src/graphql/resolvers/types/weather-unit-resolver'

describe('game-unit-resolver', () => {
  describe('fromObject', () => {
    it('returns DeckUnit if type is Deck', async () => {
      const unit = TestUtil.getUnit({})
      const deckUnit = TestUtil.getDbDeckUnit({
        id: unit.id,
      })
      await testFromObject({
        gameUnit: TestUtil.getDbGameUnit({
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
        gameUnit: TestUtil.getDbGameUnit({
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
        gameUnit: TestUtil.getDbGameUnit({
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
        gameUnits: [],
      })
    })
    it('returns single resolved gameUnit without presolved unit', async () => {
      await testFromArray({
        gameUnits: [TestUtil.getDbGameUnit({})],
      })
    })
    it('returns single resolved gameUnit with presolved unit', async () => {
      const unit = TestUtil.getUnit({})
      await testFromArray({
        gameUnits: [
          TestUtil.getDbGameUnit({
            id: unit.id,
          }),
        ],
        units: [unit],
      })
    })
    it('returns multiple resolved gameUnits without presolved unit', async () => {
      await testFromArray({
        gameUnits: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
      })
    })
    it('returns multiple resolved gameUnits with presolved unit', async () => {
      const unit1 = TestUtil.getUnit({})
      const unit2 = TestUtil.getUnit({})
      await testFromArray({
        gameUnits: [
          TestUtil.getDbGameUnit({
            id: unit1.id,
          }),
          TestUtil.getDbGameUnit({
            id: unit2.id,
          }),
        ],
        units: [unit1, unit2],
      })
    })
  })
})

async function testFromObject({
  gameUnit,
  unit,
  deckUnit,
  fieldUnit,
  weatherUnit,
}: {
  gameUnit: GameUnitDbObject
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
    GameUnitResolver.fromObject({
      gameUnit,
      unit,
    })
  ).resolves.toEqual(deckUnit || fieldUnit || weatherUnit)

  expect(deckUnitResolverSpy.mock.calls).toEqual(
    deckUnit
      ? [
          [
            {
              deckUnit: gameUnit,
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
              fieldUnit: gameUnit,
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
              weatherUnit: gameUnit,
              unit,
            },
          ],
        ]
      : []
  )
}

async function testFromArray({ gameUnits, units }: { gameUnits: GameUnitDbObject[]; units?: Unit[] }) {
  const resolvedUnits: Unit[] =
    units ||
    gameUnits.map((gameUnit) => {
      return TestUtil.getUnit({
        id: gameUnit.unit,
      })
    })
  const resolvedGameUnits: GameUnit[] = []
  const unitResolverSpy = jest.spyOn(UnitResolver, 'fromIds').mockResolvedValue(resolvedUnits)
  const gameUnitResolverSpy = jest.spyOn(GameUnitResolver, 'fromObject')
  const gameUnitResolverCalls: any[][] = []
  for (let i = 0; i < gameUnits.length; i++) {
    const resolvedGameUnit = TestUtil.getGameUnitFromDbGameUnit({
      gameUnit: gameUnits[i],
      unit: resolvedUnits[i],
    })
    gameUnitResolverSpy.mockResolvedValueOnce(resolvedGameUnit)
    resolvedGameUnits.push(resolvedGameUnit)
    gameUnitResolverCalls.push([
      {
        gameUnit: gameUnits[i],
        unit: resolvedUnits[i],
      },
    ])
  }

  await expect(
    GameUnitResolver.fromArray({
      gameUnits,
      units,
    })
  ).resolves.toEqual(resolvedGameUnits)

  expect(unitResolverSpy.mock.calls).toEqual(
    gameUnits.length === 0 || units
      ? []
      : [
          [
            {
              ids: gameUnits.map((gameUnit) => gameUnit.unit),
            },
          ],
        ]
  )
  expect(gameUnitResolverSpy.mock.calls).toEqual(gameUnitResolverCalls)
}
