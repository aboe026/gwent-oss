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
    it('calls to resolvers with unique unit ids if undefined neutralStats', async () => {
      await testResolveFromArray({})
    })
    it('calls to resolvers with unique unit ids if explicit false neutralStats', async () => {
      await testResolveFromArray({
        neutralStats: false,
      })
    })
    it('calls to resolvers with unique unit ids if explicit true neutralStats', async () => {
      await testResolveFromArray({
        neutralStats: true,
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
  const unitResolverSpy = jest.spyOn(UnitResolver, 'resolveFromId').mockResolvedValue(unitResolverResponse)

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

async function testResolveFromArray({ neutralStats }: { neutralStats?: boolean }) {
  const deckUnit1: DeckUnitDbObject = {
    artStyle: 1,
    unit: new ObjectId(),
  }
  const deckUnit2: DeckUnitDbObject = {
    artStyle: 2,
    unit: deckUnit1.unit,
  }
  const unit = TestUtil.getUnit({
    id: deckUnit1.unit,
  })
  const unitResolverSpy = jest.spyOn(UnitResolver, 'resolveFromIds').mockResolvedValue([unit])

  await expect(
    DeckUnitResolver.resolveFromArray({
      deckUnits: [deckUnit1, deckUnit2],
      neutralStats,
    })
  ).resolves.toEqual([
    {
      artStyle: 1,
      unit,
    },
    {
      artStyle: 2,
      unit,
    },
  ])

  expect(unitResolverSpy.mock.calls).toEqual([
    [
      {
        ids: [deckUnit1.unit],
        neutralStats,
      },
    ],
  ])
}
