import { EffectDbObject, EffectKey } from '@gwent/graphql-schema/database-typings'
import EffectResolver from '../../src/graphql/resolvers/effect-resolver'
import { ObjectId } from 'mongodb'
import EffectStore from '../../src/database/stores/effect-store'
import { Effect } from '@gwent/graphql-schema/resolver-typings'
import TestUtil from '../test-util'

describe('effect-resolver', () => {
  describe('resolveFromObject', () => {
    it('returns transformed object', () => {
      const effect: EffectDbObject = {
        _id: new ObjectId(),
        ability: 'effect-ability',
        created: new Date(),
        image: 'effect-image',
        key: EffectKey.Agile,
        name: 'effect-name',
      }
      expect(EffectResolver.resolveFromObject(effect)).toEqual({
        ability: effect.ability,
        created: effect.created,
        id: effect._id.toString(),
        image: effect.image,
        key: effect.key,
        name: effect.name,
      })
    })
  })
  describe('resolveFromIds', () => {
    it('throws error if effect not found', async () => {
      const effectId = new ObjectId()
      await testResolveFromIds({
        ids: [effectId],
        error: `Could not resolve effect "${effectId}".`,
        effectGetCalls: [
          [
            {
              ids: [effectId],
            },
          ],
        ],
      })
    })
    it('returns null if nothing passed', async () => {
      await testResolveFromIds({
        passId: false,
        expected: null,
      })
    })
    it('returns null if undefined passed', async () => {
      await testResolveFromIds({
        ids: undefined,
        expected: null,
      })
    })
    it('returns empty array if empty array passed', async () => {
      await testResolveFromIds({
        ids: [],
        expected: [],
      })
    })
    it('calls to effect store and returns resolved objects if effectIds are ObjectIds', async () => {
      const effectId = new ObjectId()
      await testResolveFromIds({
        ids: [effectId],
        effectGetResponse: [
          TestUtil.getDbEffect({
            id: effectId,
          }),
        ],
        expected: [
          TestUtil.getEffect({
            id: effectId,
          }),
        ],
        effectGetCalls: [
          [
            {
              ids: [effectId],
            },
          ],
        ],
      })
    })
  })
})

async function testResolveFromIds({
  ids,
  passId = true,
  effectGetResponse = [],
  error,
  expected,
  effectGetCalls = [],
}: {
  ids?: (string | ObjectId)[]
  passId?: boolean
  effectGetResponse?: EffectDbObject[]
  error?: string
  expected?: Effect[] | null
  effectGetCalls?: any[][]
}) {
  const effectGetSpy = jest.spyOn(EffectStore, 'get').mockResolvedValue(effectGetResponse)

  const promise = passId ? EffectResolver.resolveFromIds(ids) : EffectResolver.resolveFromIds()
  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(effectGetSpy.mock.calls).toEqual(effectGetCalls)
}
