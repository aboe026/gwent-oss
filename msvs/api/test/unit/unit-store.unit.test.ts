import { FindOptions, ObjectId } from 'mongodb'

import { Combat, UnitDbObject } from '@gwent-oss/graphql-schema/database-typings'
import UnitStore, { GetUnitsInput } from '../../src/database/stores/unit-store'

describe('unit-store', () => {
  describe('add', () => {
    it('calls to create without dlc', async () => {
      await testAdd({})
    })
    it('calls to create with dlc', async () => {
      await testAdd({
        dlc: true,
      })
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
    it('calls to read with namePrefix if supplied', async () => {
      const namePrefix = 'name-prefix'
      await testGet({
        input: {
          namePrefix,
        },
        expectedFilter: {
          $text: {
            $search: namePrefix,
          },
        },
      })
    })
    it('calls to read with names if supplied', async () => {
      const names = ['name1', 'name2']
      await testGet({
        input: {
          names,
        },
        expectedFilter: {
          name: {
            $in: names,
          },
        },
      })
    })
    it('calls to read if specials true', async () => {
      const specials = true
      await testGet({
        input: {
          specials,
        },
        expectedFilter: {
          special: specials,
        },
      })
    })
    it('calls to read if specials false', async () => {
      const specials = false
      await testGet({
        input: {
          specials,
        },
        expectedFilter: {
          special: specials,
        },
      })
    })
    it('calls to read if heroes true', async () => {
      const heroes = true
      await testGet({
        input: {
          heroes,
        },
        expectedFilter: {
          hero: heroes,
        },
      })
    })
    it('calls to read if heroes false', async () => {
      const heroes = false
      await testGet({
        input: {
          heroes,
        },
        expectedFilter: {
          hero: heroes,
        },
      })
    })
    it('calls to read with ignoreIds if supplied', async () => {
      const id1 = new ObjectId()
      const id2 = new ObjectId().toString()
      await testGet({
        input: {
          ignoreIds: [id1, id2],
        },
        expectedFilter: {
          _id: {
            $nin: [id1, new ObjectId(id2)],
          },
        },
      })
    })
    it('calls to read with limit if supplied', async () => {
      const limit = 10
      await testGet({
        input: {
          limit,
        },
        expectedFilter: {},
        expectedOptions: {
          limit,
        },
      })
    })
    it('calls to read if all inputs specified', async () => {
      const id = new ObjectId()
      const faction = new ObjectId()
      const deckable = true
      const namePrefix = 'name-prefix'
      const name = 'name'
      const ignoreId = new ObjectId()
      const limit = 20
      await testGet({
        input: {
          deckable,
          factionIds: [faction],
          ids: [id],
          namePrefix,
          names: [name],
          ignoreIds: [ignoreId],
          limit,
        },
        expectedFilter: {
          faction: {
            $in: [faction],
          },
          deckable,
          _id: {
            $in: [id],
            $nin: [ignoreId],
          },
          $text: {
            $search: namePrefix,
          },
          name: {
            $in: [name],
          },
        },
        expectedOptions: {
          limit,
        },
      })
    })
    it('logs to debug if enabled', async () => {
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
          faction: {
            $in: [faction],
          },
          deckable,
          _id: {
            $in: [id],
          },
        },
        debugEnabled: true,
      })
    })
    it('logs to trace if enabled', async () => {
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
          faction: {
            $in: [faction],
          },
          deckable,
          _id: {
            $in: [id],
          },
        },
        traceEnabled: true,
      })
    })
  })
})

async function testAdd({ dlc, traceEnabled }: { dlc?: boolean; traceEnabled?: boolean }) {
  const combats = [Combat.Close]
  const created = new Date()
  const deckable = true
  const dlcId = dlc ? new ObjectId() : undefined
  const effectPrefix = ''
  const effects = [new ObjectId()]
  const faction = new ObjectId()
  const hero = false
  const images = ['image']
  const name = 'name'
  const modifier = false
  const quote = 'quote'
  const scorchMin = 10
  const scorchScope = Combat.Ranged
  const special = false
  const strength = 5
  const expected: UnitDbObject = {
    combats,
    created,
    deckable,
    dlc: dlcId,
    effectPrefix,
    effects,
    faction,
    hero,
    _id: new ObjectId(),
    images,
    name,
    modifier,
    quote,
    scorchMin,
    scorchScope,
    special,
    strength,
  }
  const createSpy = jest.spyOn(UnitStore as any, 'create').mockResolvedValue(expected)
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => created)
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  UnitStore['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(
    UnitStore.add({
      combats,
      deckable,
      dlc: dlcId?.toString(),
      effectPrefix,
      effects,
      faction,
      hero,
      images,
      name,
      modifier,
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
        dlc: dlcId,
        effectPrefix,
        effects,
        faction,
        hero,
        images,
        modifier,
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
  expect(debugSpy.mock.calls).toEqual([[`Adding unit with name "${name}"`]])
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
              modifier,
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

async function testGet({
  expectedFilter,
  expectedOptions,
  input,
  debugEnabled,
  traceEnabled,
}: {
  expectedFilter: any
  expectedOptions?: any
  input: GetUnitsInput
  debugEnabled?: boolean
  traceEnabled?: boolean
}) {
  const readSpy = jest.spyOn(UnitStore as any, 'readMany').mockResolvedValue([])
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  UnitStore['logger'] = {
    isDebugEnabled: jest.fn().mockReturnValue(debugEnabled),
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any
  const options: FindOptions = {
    collation: {
      locale: 'en',
    },
    sort: {
      name: 1,
      _id: 1,
    },
    ...expectedOptions,
  }

  await expect(UnitStore.get(input)).resolves.toEqual([])

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter: expectedFilter,
        options,
      },
    ],
  ])
  expect(debugSpy.mock.calls).toEqual(
    debugEnabled
      ? [[`Getting units with factions "${JSON.stringify(input.factionIds)}" and ids "${JSON.stringify(input.ids)}"`]]
      : []
  )
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [[`get filter: "${JSON.stringify(expectedFilter)}`], [`get options: "${JSON.stringify(options)}`]]
      : []
  )
}
