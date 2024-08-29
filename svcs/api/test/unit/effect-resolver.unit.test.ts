import { EffectDbObject, EffectKey } from '@gwent/graphql-schema/database-typings'
import EffectResolver from '../../src/graphql/resolvers/effect-resolver'
import { ObjectId } from 'mongodb'
import EffectStore from '../../src/database/stores/effect-store'
import { Effect } from '@gwent/graphql-schema/resolver-typings'

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
    it('returns null if nothing passed', async () => {
      await testResolveFromIds({
        passId: false,
        expected: false,
      })
    })
    it('returns null if undefined passed', async () => {
      await testResolveFromIds({
        ids: undefined,
        expected: false,
      })
    })
    it('returns empty array if empty array passed', async () => {
      await testResolveFromIds({
        ids: [],
        expected: true,
      })
    })
    it('calls to effect store and returns resolved objects if effectIds are ObjectIds', async () => {
      await testResolveFromIds({
        ids: [new ObjectId()],
        expected: true,
      })
    })
  })
})

async function testResolveFromIds({
  ids,
  passId = true,
  expected,
}: {
  ids?: (string | ObjectId)[]
  passId?: boolean
  expected: boolean
}) {
  const effect: EffectDbObject = {
    _id: ids ? new ObjectId(ids[0]) : new ObjectId(),
    ability: 'effect-ability',
    created: new Date(),
    image: 'effect-image',
    key: EffectKey.Agile,
    name: 'effect-name',
  }
  const effectGetSpy = jest.spyOn(EffectStore, 'get').mockResolvedValue(ids && ids.length > 0 ? [effect] : [])

  let expectedResponse: Effect[] | null = null
  if (expected) {
    expectedResponse = []
    if (ids && ids.length > 0) {
      expectedResponse.push({
        ability: effect.ability,
        created: effect.created,
        id: ids ? effect._id.toString() : '',
        image: effect.image,
        key: EffectKey.Agile,
        name: effect.name,
      })
    }
  }
  await expect(passId ? EffectResolver.resolveFromIds(ids) : EffectResolver.resolveFromIds()).resolves.toEqual(
    expectedResponse
  )

  expect(effectGetSpy.mock.calls).toEqual(
    expected && ids && ids.length > 0
      ? [
          [
            {
              ids: ids && ids.length > 0 ? [effect._id] : [],
            },
          ],
        ]
      : []
  )
}
