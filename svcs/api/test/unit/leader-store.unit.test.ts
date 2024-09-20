import { ObjectId } from 'mongodb'

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
          _id: {
            $in: [id],
          },
          faction: {
            $in: [faction],
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
  const traceSpy = jest.fn().mockImplementation()
  LeaderStore['logger'] = {
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
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`Adding leader: "${JSON.stringify({ ability, created, dlc, faction, image, name, quote })}"`]] : []
  )
}

// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
async function testGet({ expectedFilter, input }: { expectedFilter: Object; input: GetLeadersInput }) {
  const readSpy = jest.spyOn(LeaderStore as any, 'read').mockResolvedValue([])

  await expect(LeaderStore.get(input)).resolves.toEqual([])

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter: expectedFilter,
        options: {
          collation: {
            locale: 'en',
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
