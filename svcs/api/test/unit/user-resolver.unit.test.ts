import UserResolver from '../../src/graphql/resolvers/user-resolver'
import { ObjectId } from 'mongodb'
import UserStore from '../../src/database/stores/user-store'
import TestUtil from '../test-util'
import Verifier from '../../src/util/verifier'

describe('user-resolver', () => {
  describe('fromObject', () => {
    it('returns resolved object', () => {
      const user = TestUtil.getDbUser({})
      expect(UserResolver.fromObject(user)).toEqual({
        created: user.created,
        id: user._id.toString(),
        name: user.name,
      })
    })
  })
  describe('fromId', () => {
    it('returns first user from fromIds', async () => {
      const user = TestUtil.getUser({})
      const fromIdsSpy = jest.spyOn(UserResolver, 'fromIds').mockResolvedValue([user])

      await expect(UserResolver.fromId(user.id)).resolves.toEqual(user)

      expect(fromIdsSpy.mock.calls).toEqual([[[user.id]]])
    })
  })
  describe('fromIds', () => {
    it('throws error if verifyObjects throws error', async () => {
      await testResolveByIds({
        ids: [new ObjectId()],
        verifyObjectsResponse: Error('Could not find users "["id"]" to resolve.'),
      })
    })
    it('returns empty array if getByIds returns empty array', async () => {
      await testResolveByIds({
        ids: [],
      })
    })
    it('returns resolved user if getByIds returns user from ObjectId', async () => {
      await testResolveByIds({
        ids: [new ObjectId()],
      })
    })
    it('returns resolved user if getByIds returns user from string', async () => {
      await testResolveByIds({
        ids: [new ObjectId().toString()],
      })
    })
  })
})

async function testResolveByIds({
  ids,
  verifyObjectsResponse,
}: {
  ids: (ObjectId | string)[]
  verifyObjectsResponse?: Error
}) {
  const users = ids.map((id) => TestUtil.getDbUser({ id }))
  const userGetSpy = jest.spyOn(UserStore, 'getByIds').mockResolvedValue(users)
  const verifyObjectsSpy = jest.spyOn(Verifier, 'checkObjects')
  if (verifyObjectsResponse) {
    verifyObjectsSpy.mockImplementation(() => {
      throw verifyObjectsResponse
    })
  } else {
    verifyObjectsSpy.mockReturnValue()
  }
  const fromObjectSpy = jest.spyOn(UserResolver, 'fromObject')
  for (const user of users) {
    fromObjectSpy.mockReturnValueOnce(TestUtil.getUserFromDbUser(user))
  }

  const promise = UserResolver.fromIds(ids)
  if (verifyObjectsResponse) {
    await expect(promise).rejects.toThrow(verifyObjectsResponse)
  } else {
    await expect(promise).resolves.toEqual(users.map((user) => TestUtil.getUserFromDbUser(user)))
  }

  expect(userGetSpy.mock.calls).toEqual(ids.length === 0 ? [] : [[ids]])
  expect(verifyObjectsSpy.mock.calls).toEqual(
    ids.length === 0
      ? []
      : [
          [
            {
              expectedKeys: ids,
              objects: users,
              field: '_id',
              logger: UserResolver['logger'],
              label: 'users',
            },
          ],
        ]
  )
  expect(fromObjectSpy.mock.calls).toEqual(ids.length === 0 || verifyObjectsResponse ? [] : [users])
}
