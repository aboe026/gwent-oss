import { ObjectId } from 'mongodb'

import { GameUnit, Unit } from '@gwent/graphql-schema/resolver-typings'
import { GameUnitDbObject } from '@gwent/graphql-schema/database-typings'
import GameUnitResolver from '../../src/graphql/resolvers/types/game-unit-resolver'
import TestUtil from '../test-util'
import UnitResolver from '../../src/graphql/resolvers/types/unit-resolver'

describe('game-unit-resolver', () => {
  describe('fromObject', () => {
    it('does not reach out to UnitResolver if unit provided', async () => {
      const unit: Unit = TestUtil.getUnit({})
      await testFromObject({
        gameUnit: {
          artStyle: 1,
          effectiveStrength: 2,
          unit: new ObjectId(unit.id),
        },
        unit,
      })
    })
    it('reaches out to UnitResolver if unit not provided', async () => {
      await testFromObject({
        gameUnit: {
          artStyle: 1,
          effectiveStrength: 2,
          unit: new ObjectId(),
        },
      })
    })
  })
  describe('fromArray', () => {
    it('does not call to UnitResolver or fromObject if empty gameUnits', async () => {
      await testFromArray({
        gameUnits: [],
      })
    })
    it('calls to UnitResolver and fromObject if gameUnits not empty', async () => {
      const unit1 = TestUtil.getUnit({})
      const unit2 = TestUtil.getUnit({})
      await testFromArray({
        gameUnits: [
          {
            artStyle: 1,
            effectiveStrength: 2,
            unit: new ObjectId(unit1.id),
          },
          {
            artStyle: 3,
            effectiveStrength: 4,
            unit: new ObjectId(unit2.id),
          },
        ],
        resolvedUnits: [unit1, unit2],
      })
    })
  })
})

async function testFromObject({ gameUnit, unit }: { gameUnit: GameUnitDbObject; unit?: Unit }) {
  const resolvedUnit =
    unit ||
    TestUtil.getUnit({
      id: gameUnit.unit,
    })
  const unitFromIdSpy = jest.spyOn(UnitResolver, 'fromId').mockResolvedValue(resolvedUnit)

  const expected: GameUnit = {
    artStyle: gameUnit.artStyle,
    effectiveStrength: gameUnit.effectiveStrength,
    unit: resolvedUnit,
  }
  await expect(
    GameUnitResolver.fromObject({
      gameUnit,
      unit,
    })
  ).resolves.toEqual(expected)

  expect(unitFromIdSpy.mock.calls).toEqual(
    unit
      ? []
      : [
          [
            {
              id: gameUnit.unit,
            },
          ],
        ]
  )
}

async function testFromArray({ gameUnits, resolvedUnits }: { gameUnits: GameUnitDbObject[]; resolvedUnits?: Unit[] }) {
  const unitFromIdsSpy = jest.spyOn(UnitResolver, 'fromIds')
  if (resolvedUnits) {
    unitFromIdsSpy.mockResolvedValue(resolvedUnits)
  }
  const fromObjectSpy = jest.spyOn(GameUnitResolver, 'fromObject')
  const expected: GameUnit[] = []
  gameUnits.map((gameUnit, index) => {
    const resolvedGameUnit: GameUnit = {
      artStyle: gameUnit.artStyle,
      effectiveStrength: gameUnit.effectiveStrength,
      unit: (resolvedUnits || [])[index],
    }
    fromObjectSpy.mockResolvedValueOnce(resolvedGameUnit)
    expected.push(resolvedGameUnit)
  })

  await expect(
    GameUnitResolver.fromArray({
      gameUnits,
    })
  ).resolves.toEqual(expected)

  expect(unitFromIdsSpy.mock.calls).toEqual(
    gameUnits.length > 0
      ? [
          [
            {
              ids: gameUnits.map((gameUnit) => gameUnit.unit),
            },
          ],
        ]
      : []
  )
  expect(fromObjectSpy.mock.calls).toEqual(
    gameUnits.length > 0
      ? gameUnits.map((gameUnit, index) => {
          return [
            {
              gameUnit,
              unit: (resolvedUnits || [])[index],
            },
          ]
        })
      : []
  )
}
