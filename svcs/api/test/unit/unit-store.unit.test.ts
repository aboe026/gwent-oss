import { ObjectId } from 'mongodb'

import { Combat, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import UnitStore, { GetUnitsInput } from '../../src/database/stores/unit-store'

describe('unit-store', () => {
  describe('add', () => {
    it('calls to create', async () => {
      await testAdd({})
    })
    it('calls to create with trace enabled', async () => {
      await testAdd({
        traceEnabled: true,
      })
    })
  })
  describe('get', () => {
    it('calls to read with empty filter if no ids factions or deckable', async () => {
      await testGet({
        input: {},
        expectedFilter: {},
      })
    })
    it('calls to read with ids filter if only string ids supplied', async () => {
      const id = new ObjectId()
      await testGet({
        input: {
          ids: [id.toString()],
        },
        expectedFilter: {
          _id: {
            $in: [id],
          },
        },
      })
    })
    it('calls to read with ids filter if only ObjectId ids supplied', async () => {
      const id = new ObjectId()
      await testGet({
        input: {
          ids: [id],
        },
        expectedFilter: {
          _id: {
            $in: [id],
          },
        },
      })
    })
    it('calls to read with factions filter if only factions supplied', async () => {
      const faction = new ObjectId()
      await testGet({
        input: {
          factionIds: [faction],
        },
        expectedFilter: {
          faction: {
            $in: [faction],
          },
        },
      })
    })
    it('calls to read without deckable if undefined', async () => {
      await testGet({
        input: {
          deckable: undefined,
        },
        expectedFilter: {},
      })
    })
    it('calls to read with deckable if false', async () => {
      const deckable = false
      await testGet({
        input: {
          deckable,
        },
        expectedFilter: {
          deckable,
        },
      })
    })
    it('calls to read with deckable if true', async () => {
      const deckable = true
      await testGet({
        input: {
          deckable,
        },
        expectedFilter: {
          deckable,
        },
      })
    })
    it('calls to read if ids factions and deckable all specified', async () => {
      const id = new ObjectId()
      const faction = new ObjectId()
      const deckable = true
      await testGet({
        input: {
          deckable,
          factionIds: [faction],
          ids: [id],
        },
        expectedFilter: {
          deckable,
          faction: {
            $in: [faction],
          },
          _id: {
            $in: [id],
          },
        },
      })
    })
  })
})

async function testAdd({ traceEnabled }: { traceEnabled?: boolean }) {
  const combats = [Combat.Close]
  const created = new Date()
  const deckable = true
  const dlc = new ObjectId()
  const effectPrefix = ''
  const effects = [new ObjectId()]
  const faction = new ObjectId()
  const hero = false
  const images = ['image']
  const name = 'name'
  const quote = 'quote'
  const scorchMin = 10
  const scorchScope = Combat.Ranged
  const special = false
  const strength = 5
  const expected: UnitDbObject = {
    combats,
    created,
    deckable,
    dlc,
    effectPrefix,
    effects,
    faction,
    hero,
    _id: new ObjectId(),
    images,
    name,
    quote,
    scorchMin,
    scorchScope,
    special,
    strength,
  }
  const createSpy = jest.spyOn(UnitStore as any, 'create').mockResolvedValue(expected)
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => created)
  const traceSpy = jest.fn().mockImplementation()
  UnitStore['logger'] = {
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(
    UnitStore.add({
      combats,
      deckable,
      dlc,
      effectPrefix,
      effects,
      faction,
      hero,
      images,
      name,
      quote,
      scorchMin,
      scorchScope,
      special,
      strength,
    })
  ).resolves.toEqual(expected)

  expect(createSpy.mock.calls).toEqual([
    [
      {
        combats,
        created,
        deckable,
        dlc,
        effectPrefix,
        effects,
        faction,
        hero,
        images,
        name,
        quote,
        scorchMin,
        scorchScope,
        special,
        strength,
      },
    ],
  ])
  expect(dateSpy.mock.calls).toEqual([[]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `Adding unit: "${JSON.stringify({
              combats,
              created,
              deckable,
              dlc,
              effectPrefix,
              effects,
              faction,
              hero,
              images,
              name,
              quote,
              scorchMin,
              scorchScope,
              special,
              strength,
            })}"`,
          ],
        ]
      : []
  )
}

// eslint-disable-next-line @typescript-eslint/ban-types
async function testGet({ expectedFilter, input }: { expectedFilter: Object; input: GetUnitsInput }) {
  const readSpy = jest.spyOn(UnitStore as any, 'read').mockResolvedValue([])

  await expect(UnitStore.get(input)).resolves.toEqual([])

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter: expectedFilter,
        options: {
          collation: {
            locale: 'en', // allows for case-insensitivity
          },
          sort: {
            name: 1,
            _id: 1,
          },
        },
      },
    ],
  ])
}
