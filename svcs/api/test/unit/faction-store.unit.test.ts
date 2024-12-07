import { Document, Filter, ObjectId, UpdateFilter } from 'mongodb'

import { FactionDbObject, FactionKey } from '@gwent/graphql-schema/database-typings'
import FactionStore, { EditFactionInput, GetFactionsInput } from '../../src/database/stores/faction-store'
import TestUtil from '../test-util'

describe('faction-store', () => {
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
  describe('edit', () => {
    it('calls to update with correct filter and update', async () => {
      await testEdit({
        input: {
          id: new ObjectId(),
          stats: TestUtil.getStats(),
        },
      })
    })
    it('logs to trace if enabled', async () => {
      await testEdit({
        input: {
          id: new ObjectId(),
          stats: TestUtil.getStats(),
        },
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
      const key = FactionKey.NorthernRealms
      await testGet({
        input: {
          keys: [key],
        },
        expectedFilter: {
          key: {
            $in: [key],
          },
        },
      })
    })
    it('calls to read with ids and keys filter if both supplied', async () => {
      const id = new ObjectId()
      const key = FactionKey.NorthernRealms
      await testGet({
        input: {
          ids: [id],
          keys: [key],
        },
        expectedFilter: {
          _id: {
            $in: [id],
          },
          key: {
            $in: [key],
          },
        },
      })
    })
    it('logs to debug if enabled', async () => {
      const id = new ObjectId()
      const key = FactionKey.NorthernRealms
      await testGet({
        input: {
          ids: [id],
          keys: [key],
        },
        expectedFilter: {
          _id: {
            $in: [id],
          },
          key: {
            $in: [key],
          },
        },
        debugEnabled: true,
      })
    })
    it('logs to trace if enabled', async () => {
      const id = new ObjectId()
      const key = FactionKey.NorthernRealms
      await testGet({
        input: {
          ids: [id],
          keys: [key],
        },
        expectedFilter: {
          _id: {
            $in: [id],
          },
          key: {
            $in: [key],
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
  const image = 'image'
  const key = FactionKey.Monsters
  const name = 'name'
  const expected: FactionDbObject = {
    _id: new ObjectId(),
    created,
    ability,
    dlc,
    image,
    key,
    name,
  } as any
  const createSpy = jest.spyOn(FactionStore as any, 'create').mockResolvedValue(expected)
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => created)
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  FactionStore['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(
    FactionStore.add({
      ability,
      dlc,
      image,
      key,
      name,
    })
  ).resolves.toEqual(expected)

  expect(createSpy.mock.calls).toEqual([
    [
      {
        ability,
        created,
        dlc,
        image,
        key,
        name,
      },
    ],
  ])
  expect(dateSpy.mock.calls).toEqual([[]])
  expect(debugSpy.mock.calls).toEqual([[`Adding faction with name "${name}"`]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`Adding faction: "${JSON.stringify({ ability, created, dlc, image, key, name })}"`]] : []
  )
}

async function testEdit({ input, traceEnabled }: { input: EditFactionInput; traceEnabled?: boolean }) {
  const readSpy = jest.spyOn(FactionStore as any, 'update').mockResolvedValue({})
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  FactionStore['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(FactionStore.edit(input)).resolves.toEqual({})
  const filter: Filter<Document> = {
    _id: new ObjectId(input.id),
  }
  const update: UpdateFilter<Document> = {
    $set: {
      stats: input.stats,
    },
  }

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter,
        update,
      },
    ],
  ])
  expect(debugSpy.mock.calls).toEqual([[`Editing faction with id "${input.id}"`]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`edit filter for ID "${input.id}": "${JSON.stringify(filter)}"`],
          [`edit update for ID "${input.id}": "${JSON.stringify(update)}"`],
        ]
      : []
  )
}

async function testGet({
  input,
  expectedFilter,
  debugEnabled,
  traceEnabled,
}: {
  input: GetFactionsInput
  expectedFilter?: any
  debugEnabled?: boolean
  traceEnabled?: boolean
}) {
  const readSpy = jest.spyOn(FactionStore as any, 'read').mockResolvedValue([])
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  FactionStore['logger'] = {
    isDebugEnabled: jest.fn().mockReturnValue(debugEnabled),
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(FactionStore.get(input)).resolves.toEqual([])

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter: expectedFilter,
      },
    ],
  ])
  expect(debugSpy.mock.calls).toEqual(
    debugEnabled
      ? [[`Getting faction with ids "${JSON.stringify(input.ids)}" and keys "${JSON.stringify(input.keys)}"`]]
      : []
  )
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`get filter: "${JSON.stringify(expectedFilter)}"`]] : [])
}
