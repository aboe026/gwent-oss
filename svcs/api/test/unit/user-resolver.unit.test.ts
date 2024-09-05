import UserResolver from '../../src/graphql/resolvers/user-resolver'
import { ObjectId } from 'mongodb'
import UserStore from '../../src/database/stores/user-store'
import TestUtil from '../test-util'

describe('user-resolver', () => {
  describe('resolveByObject', () => {
    it('returns resolved object', () => {
      const user = TestUtil.getDbUser({})
      expect(UserResolver.resolveByObject(user)).toEqual({
        created: user.created,
        id: user._id.toString(),
        name: user.name,
      })
    })
  })
  describe('resolveById', () => {
    it('returns undefined if resolveByIds returns undefined', async () => {
      const id = new ObjectId()
      const resolveByIdsSpy = jest.spyOn(UserResolver, 'resolveByIds').mockResolvedValue(undefined as any)

      await expect(UserResolver.resolveById(id)).resolves.toEqual(undefined)

      expect(resolveByIdsSpy.mock.calls).toEqual([[[id]]])
    })
    it('returns undefined if resolveByIds returns emptpy array', async () => {
      const id = new ObjectId()
      const resolveByIdsSpy = jest.spyOn(UserResolver, 'resolveByIds').mockResolvedValue([])

      await expect(UserResolver.resolveById(id)).resolves.toEqual(undefined)

      expect(resolveByIdsSpy.mock.calls).toEqual([[[id]]])
    })
    it('returns resolved user if resolveByIds returns user from ObjectId', async () => {
      const id = new ObjectId()
      const user = TestUtil.getUser({
        id,
      })
      const resolveByIdsSpy = jest.spyOn(UserResolver, 'resolveByIds').mockResolvedValue([user])

      await expect(UserResolver.resolveById(id)).resolves.toEqual(user)

      expect(resolveByIdsSpy.mock.calls).toEqual([[[id]]])
    })
    it('returns resolved user if resolveByIds returns user from string', async () => {
      const id = new ObjectId()
      const user = TestUtil.getUser({
        id,
      })
      const resolveByIdsSpy = jest.spyOn(UserResolver, 'resolveByIds').mockResolvedValue([user])

      await expect(UserResolver.resolveById(id.toString())).resolves.toEqual(user)

      expect(resolveByIdsSpy.mock.calls).toEqual([[[id.toString()]]])
    })
  })
  describe('resolveByIds', () => {
    it('returns empty array if getByIds returns empty array', async () => {
      const getByIdsSpy = jest.spyOn(UserStore, 'getByIds').mockResolvedValue([])

      await expect(UserResolver.resolveByIds([])).resolves.toEqual([])

      expect(getByIdsSpy.mock.calls).toEqual([[[]]])
    })
    it('returns resolved user if getByIds returns user from ObjectId', async () => {
      const user = TestUtil.getDbUser({})
      const getByIdsSpy = jest.spyOn(UserStore, 'getByIds').mockResolvedValue([user])

      await expect(UserResolver.resolveByIds([user._id])).resolves.toEqual([
        {
          created: user.created,
          id: user._id.toString(),
          name: user.name,
        },
      ])

      expect(getByIdsSpy.mock.calls).toEqual([[[user._id]]])
    })
    it('returns resolved user if getByIds returns user from string', async () => {
      const user = TestUtil.getDbUser({})
      const getByIdsSpy = jest.spyOn(UserStore, 'getByIds').mockResolvedValue([user])

      await expect(UserResolver.resolveByIds([user._id.toString()])).resolves.toEqual([
        {
          created: user.created,
          id: user._id.toString(),
          name: user.name,
        },
      ])

      expect(getByIdsSpy.mock.calls).toEqual([[[user._id.toString()]]])
    })
  })
})
