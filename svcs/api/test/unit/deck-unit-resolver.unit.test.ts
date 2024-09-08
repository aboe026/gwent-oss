import { DeckUnitDbObject } from '@gwent/graphql-schema/database-typings'
import UnitResolver from '../../src/graphql/resolvers/unit-resolver'
import { ObjectId } from 'mongodb'
import DeckUnitResolver from '../../src/graphql/resolvers/deck-unit-resolver'
import { Unit } from '@gwent/graphql-schema/resolver-typings'
import TestUtil from '../test-util'

describe('deck-unit-resolver', () => {
  describe('resolveFromObject', () => {
    it('throws error if unit not found', async () => {
      const unitId = new ObjectId()
      await testResolveFromObject({
        deckUnit: {
          artStyle: 1,
          unit: unitId,
        },
        error: `Could not resolve unit "${unitId}" as deckUnit.`,
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
  describe('resolveFromArray', () => {
    it('throws error if deck unit not found', async () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      await testResolveFromArray({
        deckUnits: [deckUnit],
        resolvedUnits: [],
        error: `Could not resolved deck unit "${deckUnit.unit}" in array.`,
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
  unitResolverResponse,
  error,
}: {
  deckUnit: DeckUnitDbObject
  neutralStats?: boolean
  unitResolverResponse?: Unit
  error?: string
}) {
  const unitResolverSpy = jest.spyOn(UnitResolver, 'resolveFromId')
  if (unitResolverResponse) {
    unitResolverSpy.mockResolvedValue(unitResolverResponse)
  }

  const promise = DeckUnitResolver.resolveFromObject({
    deckUnit,
    neutralStats,
  })
  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual({
      artStyle: deckUnit.artStyle,
      unit: unitResolverResponse,
    })
  }

  expect(unitResolverSpy.mock.calls).toEqual([
    [
      {
        id: deckUnit.unit,
        neutralStats,
      },
    ],
  ])
}

async function testResolveFromArray({
  deckUnits = [],
  neutralStats,
  resolvedUnits = [],
  error,
  unitResolverCalls = [],
}: {
  deckUnits?: DeckUnitDbObject[]
  neutralStats?: boolean
  resolvedUnits?: Unit[]
  error?: string
  unitResolverCalls?: any[][]
}) {
  const unitResolverSpy = jest.spyOn(UnitResolver, 'resolveFromIds').mockResolvedValue(resolvedUnits)

  const promise = DeckUnitResolver.resolveFromArray({
    deckUnits,
    neutralStats,
  })
  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual(
      deckUnits?.map((deckUnit) => {
        return {
          artStyle: deckUnit.artStyle,
          unit: resolvedUnits.find((unit) => unit.id.toString() === deckUnit.unit.toString()),
        }
      })
    )
  }

  expect(unitResolverSpy.mock.calls).toEqual(unitResolverCalls)
}
