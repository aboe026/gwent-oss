import { ObjectId } from 'mongodb'

import { DeckUnitDbObject } from '@gwent/graphql-schema/database-typings'
import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import TestUtil from '../test-util'
import { Unit } from '@gwent/graphql-schema/resolver-typings'
import UnitResolver from '../../src/graphql/resolvers/types/unit-resolver'

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
    it('calls to UnitResolver if unit not provided', async () => {
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
  })
  describe('fromArray', () => {
    it('returns empty array if provided empty array', async () => {
      await testResolveFromArray({
        deckUnits: [],
      })
    })
    it('calls to resolvers with unique unit ids if provided', async () => {
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
            },
          ],
        ],
      })
    })
  })
})

async function testResolveFromObject({
  deckUnit,
  unit,
  unitResolverResponse,
}: {
  deckUnit: DeckUnitDbObject
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
            },
          ],
        ]
  )
}

async function testResolveFromArray({
  deckUnits = [],
  resolvedUnits = [],
  unitResolverCalls = [],
}: {
  deckUnits?: DeckUnitDbObject[]
  resolvedUnits?: Unit[]
  unitResolverCalls?: any[][]
}) {
  const unitResolverSpy = jest.spyOn(UnitResolver, 'fromIds').mockResolvedValue(resolvedUnits)

  await expect(
    DeckUnitResolver.fromArray({
      deckUnits,
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
