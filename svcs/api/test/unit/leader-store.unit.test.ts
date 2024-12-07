import { Document, FindOptions, ObjectId } from 'mongodb'

import { LeaderDbObject } from '@gwent/graphql-schema/database-typings'
import LeaderStore, { GetLeadersInput } from '../../src/database/stores/leader-store'

describe('leader-store', () => {
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
    it('calls to read with empty filter if no ids or keys', async () => {
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
    it('calls to read with keys filter if only keys supplied', async () => {
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
    it('calls to read with ids and keys filter if both supplied', async () => {
      const id = new ObjectId()
      const faction = new ObjectId()
      await testGet({
        input: {
          ids: [id],
          factionIds: [faction],
        },
        expectedFilter: {
          faction: {
            $in: [faction],
          },
          _id: {
            $in: [id],
          },
        },
      })
    })
    it('logs to debug if enabled', async () => {
      const id = new ObjectId()
      const faction = new ObjectId()
      await testGet({
        input: {
          ids: [id],
          factionIds: [faction],
        },
        expectedFilter: {
          faction: {
            $in: [faction],
          },
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
      await testGet({
        input: {
          ids: [id],
          factionIds: [faction],
        },
        expectedFilter: {
          faction: {
            $in: [faction],
          },
          _id: {
            $in: [id],
          },
        },
        traceEnabled: true,
      })
    })
  })
})

async function testAdd({ traceEnabled }: { traceEnabled?: boolean }) {
  const ability = 'ability'
  const created = new Date()
  const dlc = new ObjectId()
  const faction = new ObjectId()
  const image = 'image'
  const name = 'name'
  const quote = 'quote'
  const expected: LeaderDbObject = {
    ability,
    created,
    dlc,
    faction,
    _id: new ObjectId(),
    image,
    name,
    quote,
  }
  const createSpy = jest.spyOn(LeaderStore as any, 'create').mockResolvedValue(expected)
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => created)
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  LeaderStore['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(
    LeaderStore.add({
      ability,
      dlc,
      faction: faction,
      image,
      name,
      quote,
    })
  ).resolves.toEqual(expected)

  expect(createSpy.mock.calls).toEqual([
    [
      {
        ability,
        created,
        dlc,
        faction,
        image,
        name,
        quote,
      },
    ],
  ])
  expect(dateSpy.mock.calls).toEqual([[]])
  expect(debugSpy.mock.calls).toEqual([[`Adding leader with name "${name}"`]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`Adding leader: "${JSON.stringify({ ability, created, dlc, faction, image, name, quote })}"`]] : []
  )
}

async function testGet({
  expectedFilter,
  input,
  debugEnabled,
  traceEnabled,
}: {
  expectedFilter: any
  input: GetLeadersInput
  debugEnabled?: boolean
  traceEnabled?: boolean
}) {
  const readSpy = jest.spyOn(LeaderStore as any, 'read').mockResolvedValue([])
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  LeaderStore['logger'] = {
    isDebugEnabled: jest.fn().mockReturnValue(debugEnabled),
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any
  const options: FindOptions<Document> = {
    collation: {
      locale: 'en',
    },
    sort: {
      name: 1,
      _id: 1,
    },
  }

  await expect(LeaderStore.get(input)).resolves.toEqual([])

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
      ? [[`Getting leaders by factions "${JSON.stringify(input.factionIds)}" and ids "${JSON.stringify(input.ids)}"`]]
      : []
  )
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [[`get filter: "${JSON.stringify(expectedFilter)}"`], [`get options: "${JSON.stringify(options)}"`]]
      : []
  )
}
