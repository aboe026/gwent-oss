import { ObjectId } from 'mongodb'

import { EffectDbObject, EffectKey } from '@gwent/graphql-schema/database-typings'
import EffectStore, { GetEffectsInput } from '../../src/database/stores/effect-store'

describe('effect-store', () => {
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
      const key = EffectKey.Agile
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
      const key = EffectKey.Agile
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
  const image = 'image'
  const key = EffectKey.Agile
  const name = 'name'
  const expected: EffectDbObject = {
    _id: new ObjectId(),
    ability,
    created,
    image,
    key,
    name,
  }
  const createSpy = jest.spyOn(EffectStore as any, 'create').mockResolvedValue(expected)
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => created)
  const traceSpy = jest.fn().mockImplementation()
  EffectStore['logger'] = {
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(
    EffectStore.add({
      ability,
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
        image,
        key,
        name,
      },
    ],
  ])
  expect(dateSpy.mock.calls).toEqual([[]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`Adding effect: "${JSON.stringify({ ability, created, image, key, name })}"`]] : []
  )
}

// eslint-disable-next-line @typescript-eslint/ban-types
async function testGet({ expectedFilter, input }: { expectedFilter: Object; input: GetEffectsInput }) {
  const readSpy = jest.spyOn(EffectStore as any, 'read').mockResolvedValue([])

  await expect(EffectStore.get(input)).resolves.toEqual([])

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter: expectedFilter,
      },
    ],
  ])
}
