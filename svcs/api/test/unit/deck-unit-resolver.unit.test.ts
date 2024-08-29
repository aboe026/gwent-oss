import { DeckUnitDbObject } from '@gwent/graphql-schema/database-typings'
import UnitResolver from '../../src/graphql/resolvers/unit-resolver'
import { ObjectId } from 'mongodb'
import DeckUnitResolver from '../../src/graphql/resolvers/deck-unit-resolver'
import { Faction, Unit } from '@gwent/graphql-schema/resolver-typings'

describe('deck-unit-resolver', () => {
  describe('resolveFromObject', () => {
    it('calls to UnitResolver with undefined neutralStats', async () => {
      await testResolveFromObject({})
    })
    it('calls to UnitResolver with explicit false neutralStats', async () => {
      await testResolveFromObject({
        neutralStats: false,
      })
    })
    it('calls to UnitResolver with explicit true neutralStats', async () => {
      await testResolveFromObject({
        neutralStats: true,
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

async function testResolveFromObject({ neutralStats }: { neutralStats?: boolean }) {
  const deckUnit: DeckUnitDbObject = {
    artStyle: 1,
    unit: new ObjectId(),
  }
  const unit: Unit = {
    created: new Date(),
    deckable: true,
    faction: {} as Faction,
    id: deckUnit.unit.toString(),
    images: ['unit-image'],
    name: 'unit-name',
    quote: 'unit-quote',
  }
  const unitResolverSpy = jest.spyOn(UnitResolver, 'resolveFromId').mockResolvedValue(unit)

  await expect(
    DeckUnitResolver.resolveFromObject({
      deckUnit,
      neutralStats,
    })
  ).resolves.toEqual({
    artStyle: 1,
    unit,
  })

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
  const unit: Unit = {
    created: new Date(),
    deckable: true,
    faction: {} as Faction,
    id: deckUnit1.unit.toString(),
    images: ['unit-image'],
    name: 'unit-name',
    quote: 'unit-quote',
  }
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
