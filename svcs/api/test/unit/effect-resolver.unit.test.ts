import { ObjectId } from 'mongodb'

import { Effect } from '@gwent/graphql-schema/resolver-typings'
import { EffectDbObject } from '@gwent/graphql-schema/database-typings'
import EffectResolver from '../../src/graphql/resolvers/effect-resolver'
import EffectStore from '../../src/database/stores/effect-store'
import TestUtil from '../test-util'
import Verifier from '../../src/util/verifier'

describe('effect-resolver', () => {
  describe('fromObject', () => {
    it('returns transformed object', () => {
      const effect = TestUtil.getDbEffect({})
      expect(EffectResolver.fromObject(effect)).toEqual({
        ability: effect.ability,
        created: effect.created,
        id: effect._id.toString(),
        image: effect.image,
        key: effect.key,
        name: effect.name,
      })
    })
  })
  describe('fromIds', () => {
    it('throws error if verifyObjects throws error', async () => {
      const effect = TestUtil.getDbEffect({})
      await testResolveFromIds({
        ids: [effect._id],
        effectGetResponse: [],
        verifyObjectsError: `Could not find effects "["${effect._id}"]" to resolve.`,
        effectGetCalls: [
          [
            {
              ids: [effect._id],
            },
          ],
        ],
      })
    })
    it('returns empty array if given empty array', async () => {
      await testResolveFromIds({
        ids: [],
        resolveObjectResponse: [],
      })
    })
    it('returns single effect if single ObjectId', async () => {
      const effect = TestUtil.getDbEffect({})
      await testResolveFromIds({
        ids: [effect._id],
        effectGetResponse: [effect],
        resolveObjectResponse: [TestUtil.getEffectFromDbEffect(effect)],
        effectGetCalls: [
          [
            {
              ids: [effect._id],
            },
          ],
        ],
        resolveObjectCalls: [[effect]],
      })
    })
    it('returns single effect if single string', async () => {
      const effect = TestUtil.getDbEffect({})
      await testResolveFromIds({
        ids: [effect._id.toString()],
        effectGetResponse: [effect],
        resolveObjectResponse: [TestUtil.getEffectFromDbEffect(effect)],
        effectGetCalls: [
          [
            {
              ids: [effect._id.toString()],
            },
          ],
        ],
        resolveObjectCalls: [[effect]],
      })
    })
    it('returns multiple dlcs if ObjectId and string', async () => {
      const effect1 = TestUtil.getDbEffect({})
      const effect2 = TestUtil.getDbEffect({})
      await testResolveFromIds({
        ids: [effect1._id, effect2._id.toString()],
        effectGetResponse: [effect1, effect2],
        resolveObjectResponse: [TestUtil.getEffectFromDbEffect(effect1), TestUtil.getEffectFromDbEffect(effect2)],
        effectGetCalls: [
          [
            {
              ids: [effect1._id, effect2._id.toString()],
            },
          ],
        ],
        resolveObjectCalls: [[effect1], [effect2]],
      })
    })
  })
})

async function testResolveFromIds({
  ids,
  effectGetResponse = [],
  verifyObjectsError,
  resolveObjectResponse = [],
  effectGetCalls = [],
  resolveObjectCalls = [],
}: {
  ids: (ObjectId | string)[]
  effectGetResponse?: EffectDbObject[]
  verifyObjectsError?: string
  resolveObjectResponse?: Effect[]
  effectGetCalls?: any[][]
  resolveObjectCalls?: any[][]
}) {
  const effectGetSpy = jest.spyOn(EffectStore, 'get').mockResolvedValue(effectGetResponse)
  const verifyObjectsSpy = jest.spyOn(Verifier, 'checkObjects')
  if (verifyObjectsError) {
    verifyObjectsSpy.mockImplementation(() => {
      throw Error(verifyObjectsError)
    })
  } else {
    verifyObjectsSpy.mockReturnValue()
  }
  const resolveObjectSpy = jest.spyOn(EffectResolver, 'fromObject')
  for (const effect of resolveObjectResponse) {
    resolveObjectSpy.mockReturnValueOnce(effect)
  }

  const promise = EffectResolver.fromIds(ids)
  if (verifyObjectsError) {
    await expect(promise).rejects.toThrow(Error(verifyObjectsError))
  } else {
    await expect(promise).resolves.toEqual(resolveObjectResponse)
  }

  expect(effectGetSpy.mock.calls).toEqual(effectGetCalls)
  expect(verifyObjectsSpy.mock.calls).toEqual(
    ids.length === 0
      ? []
      : [
          [
            {
              expectedKeys: ids,
              objects: effectGetResponse,
              field: '_id',
              logger: EffectResolver['logger'],
              label: 'effects',
            },
          ],
        ]
  )
  expect(resolveObjectSpy.mock.calls).toEqual(resolveObjectCalls)
}
