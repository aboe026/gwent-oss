import { ObjectId } from 'mongodb'

import { FactionDbObject, FactionKey } from '@gwent/graphql-schema/database-typings'
import FactionStore, { GetFactionsInput } from '../../src/database/stores/faction-store'
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
    it('calls to update', async () => {
      const id = new ObjectId()
      const stats = TestUtil.getStats()
      const updateSpy = jest.spyOn(FactionStore as any, 'update').mockResolvedValue({ _id: id })

      await expect(
        FactionStore.edit({
          id,
          stats,
        })
      ).resolves.toEqual({ _id: id })

      expect(updateSpy.mock.calls).toEqual([
        [
          {
            filter: {
              _id: id,
            },
            update: {
              $set: {
                stats,
              },
            },
          },
        ],
      ])
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
  const traceSpy = jest.fn().mockImplementation()
  FactionStore['logger'] = {
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
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`Adding faction: "${JSON.stringify({ ability, created, dlc, image, key, name })}"`]] : []
  )
}

// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
async function testGet({ expectedFilter, input }: { expectedFilter: Object; input: GetFactionsInput }) {
  const readSpy = jest.spyOn(FactionStore as any, 'read').mockResolvedValue([])

  await expect(FactionStore.get(input)).resolves.toEqual([])

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter: expectedFilter,
      },
    ],
  ])
}
