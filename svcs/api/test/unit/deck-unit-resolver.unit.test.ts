import { DeckUnitDbObject } from '@gwent/graphql-schema/database-typings'
import UnitResolver from '../../src/graphql/resolvers/unit-resolver'
import { ObjectId } from 'mongodb'
import DeckUnitResolver from '../../src/graphql/resolvers/deck-unit-resolver'
import { Unit } from '@gwent/graphql-schema/resolver-typings'
import TestUtil from '../test-util'

describe('deck-unit-resolver', () => {
  describe('fromObject', () => {
    it('does not call to UnitResolver if unit provided', async () => {
      const unit = TestUtil.getUnit({})
      await testResolveFromObject({
        deckUnit: {
          artStyle: 1,
          unit: new ObjectId(unit.id),
        },
        unit,
      })
    })
    it('calls to UnitResolver with undefined neutralStats', async () => {
      const unitId = new ObjectId()
      await testResolveFromObject({
        deckUnit: {
          artStyle: 1,
          unit: unitId,
        },
        unitResolverResponse: TestUtil.getUnit({
          id: unitId,
        }),
      })
    })
    it('calls to UnitResolver with explicit false neutralStats', async () => {
      const unitId = new ObjectId()
      await testResolveFromObject({
        deckUnit: {
          artStyle: 1,
          unit: unitId,
        },
        neutralStats: false,
        unitResolverResponse: TestUtil.getUnit({
          id: unitId,
        }),
      })
    })
    it('calls to UnitResolver with explicit true neutralStats', async () => {
      const unitId = new ObjectId()
      await testResolveFromObject({
        deckUnit: {
          artStyle: 1,
          unit: unitId,
        },
        neutralStats: true,
        unitResolverResponse: TestUtil.getUnit({
          id: unitId,
        }),
      })
    })
  })
  describe('fromArray', () => {
    it('returns empty array if provided empty array', async () => {
      await testResolveFromArray({
        deckUnits: [],
      })
    })
    it('calls to resolvers with unique unit ids if undefined neutralStats', async () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      await testResolveFromArray({
        deckUnits: [deckUnit],
        resolvedUnits: [
          TestUtil.getUnit({
            id: deckUnit.unit,
          }),
        ],
        unitResolverCalls: [
          [
            {
              ids: [deckUnit.unit],
              neutralStats: undefined,
            },
          ],
        ],
      })
    })
    it('calls to resolvers with unique unit ids if explicit false neutralStats', async () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      await testResolveFromArray({
        deckUnits: [deckUnit],
        neutralStats: false,
        resolvedUnits: [
          TestUtil.getUnit({
            id: deckUnit.unit,
          }),
        ],
        unitResolverCalls: [
          [
            {
              ids: [deckUnit.unit],
              neutralStats: false,
            },
          ],
        ],
      })
    })
    it('calls to resolvers with unique unit ids if explicit true neutralStats', async () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      await testResolveFromArray({
        deckUnits: [deckUnit],
        neutralStats: true,
        resolvedUnits: [
          TestUtil.getUnit({
            id: deckUnit.unit,
          }),
        ],
        unitResolverCalls: [
          [
            {
              ids: [deckUnit.unit],
              neutralStats: true,
            },
          ],
        ],
      })
    })
  })
})

async function testResolveFromObject({
  deckUnit,
  neutralStats,
  unit,
  unitResolverResponse,
}: {
  deckUnit: DeckUnitDbObject
  neutralStats?: boolean
  unit?: Unit
  unitResolverResponse?: Unit
}) {
  const unitResolverSpy = jest.spyOn(UnitResolver, 'fromId')
  if (unitResolverResponse) {
    unitResolverSpy.mockResolvedValue(unitResolverResponse)
  }

  await expect(
    DeckUnitResolver.fromObject({
      deckUnit,
      neutralStats,
      unit,
    })
  ).resolves.toEqual({
    artStyle: deckUnit.artStyle,
    unit: unit || unitResolverResponse,
  })

  expect(unitResolverSpy.mock.calls).toEqual(
    unit
      ? []
      : [
          [
            {
              id: deckUnit.unit,
              neutralStats,
            },
          ],
        ]
  )
}

async function testResolveFromArray({
  deckUnits = [],
  neutralStats,
  resolvedUnits = [],
  unitResolverCalls = [],
}: {
  deckUnits?: DeckUnitDbObject[]
  neutralStats?: boolean
  resolvedUnits?: Unit[]
  unitResolverCalls?: any[][]
}) {
  const unitResolverSpy = jest.spyOn(UnitResolver, 'fromIds').mockResolvedValue(resolvedUnits)

  await expect(
    DeckUnitResolver.fromArray({
      deckUnits,
      neutralStats,
    })
  ).resolves.toEqual(
    deckUnits?.map((deckUnit) => {
      return {
        artStyle: deckUnit.artStyle,
        unit: resolvedUnits.find((unit) => unit.id.toString() === deckUnit.unit.toString()),
      }
    })
  )

  expect(unitResolverSpy.mock.calls).toEqual(unitResolverCalls)
}
