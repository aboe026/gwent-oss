import { ObjectId } from 'mongodb'

import AppInfo from '../../src/app-info'
import CardStore from '../../src/database/card-store'
import resolvers from '../../src/graphql/resolvers'
import UserStore from '../../src/database/user-store'
import { version } from '../../package.json'

describe('resolvers', () => {
  describe('Leader', () => {
    it('returns _id as string for id field', () => {
      const id = '000000000000000000000002'
      expect(
        (resolvers.Leader as any).id({
          _id: new ObjectId(id),
        })
      ).toEqual(id)
    })
  })
  describe('Unit', () => {
    it('returns _id as string for id field', () => {
      const id = '000000000000000000000002'
      expect(
        (resolvers.Unit as any).id({
          _id: new ObjectId(id),
        })
      ).toEqual(id)
    })
  })
  describe('User', () => {
    it('returns _id as string for id field', () => {
      const id = '000000000000000000000002'
      expect(
        (resolvers.User as any).id({
          _id: new ObjectId(id),
        })
      ).toEqual(id)
    })
  })
  describe('Query', () => {
    describe('leaders', () => {
      it('calls out to card store getLeaders method', async () => {
        const value: any[] = []
        const getLeadersSpy = jest.spyOn(CardStore, 'getLeaders').mockResolvedValue(value)

        await expect((resolvers.Query as any).leaders()).resolves.toEqual(value)

        expect(getLeadersSpy.mock.calls).toEqual([[]])
      })
    })
    describe('units', () => {
      it('calls out to card store getUnits method', async () => {
        const value: any[] = []
        const getUnitsSpy = jest.spyOn(CardStore, 'getUnits').mockResolvedValue(value)

        await expect((resolvers.Query as any).units()).resolves.toEqual(value)

        expect(getUnitsSpy.mock.calls).toEqual([[]])
      })
    })
    describe('getCurrentUser', () => {
      it('throws error if no user on session', () => {
        expect(() => (resolvers.Query as any).getCurrentUser()).toThrow('No user on session')
      })
      it('returns user if defined on session', () => {
        const context = {
          session: {
            user: {
              foo: 'bar',
            },
          },
        }
        expect((resolvers.Query as any).getCurrentUser(undefined, undefined, context)).toEqual(context.session.user)
      })
    })
    describe('version', () => {
      it('returns package json version', () => {
        expect((resolvers.Query as any).version()).toEqual(version)
      })
    })
    describe('build', () => {
      it('calls out to app info getBuildNumber method', async () => {
        const value = 1
        const getBuildNumberSpy = jest.spyOn(AppInfo, 'getBuildNumber').mockResolvedValue(value)

        await expect((resolvers.Query as any).build()).resolves.toEqual(value)

        expect(getBuildNumberSpy.mock.calls).toEqual([[]])
      })
    })
  })
  describe('Mutation', () => {
    describe('addUser', () => {
      it('returns error if user already exists', async () => {
        const user = {
          _id: new ObjectId(),
          name: 'name',
          password: 'password',
        }
        const error = Error(`User "${user.name}" already exists`)
        const addUserSpy = jest.spyOn(UserStore, 'addUser').mockRejectedValue(error)

        await expect(
          (resolvers.Mutation as any).addUser(
            undefined,
            {
              name: user.name,
              password: user.password,
            },
            undefined,
            undefined
          )
        ).resolves.toEqual(error)

        expect(addUserSpy.mock.calls).toEqual([[user.name, user.password]])
      })
      it('throws error if not about user already existing', async () => {
        const user = {
          _id: new ObjectId(),
          name: 'name',
          password: 'password',
        }
        const error = Error('connection refused')
        const addUserSpy = jest.spyOn(UserStore, 'addUser').mockRejectedValue(error)

        await expect(
          (resolvers.Mutation as any).addUser(
            undefined,
            {
              name: user.name,
              password: user.password,
            },
            undefined,
            undefined
          )
        ).rejects.toThrow(error)

        expect(addUserSpy.mock.calls).toEqual([[user.name, user.password]])
      })
      it('returns user if no error', async () => {
        const user = {
          _id: new ObjectId(),
          name: 'name',
          password: 'password',
          created: new Date(),
        }
        const addUserSpy = jest.spyOn(UserStore, 'addUser').mockResolvedValue(user)

        await expect(
          (resolvers.Mutation as any).addUser(
            undefined,
            {
              name: user.name,
              password: user.password,
            },
            undefined,
            undefined
          )
        ).resolves.toEqual(user)

        expect(addUserSpy.mock.calls).toEqual([[user.name, user.password]])
      })
    })
    describe('login', () => {
      it('returns error if credentials invalid', async () => {
        const name = 'name'
        const password = 'password'
        const error = Error(`Invalid credentials for user "${name}"`)
        const validateUserSpy = jest.spyOn(UserStore, 'validateUser').mockRejectedValue(error)

        await expect(
          (resolvers.Mutation as any).login(
            undefined,
            {
              name,
              password,
            },
            undefined,
            undefined
          )
        ).resolves.toEqual(error)

        expect(validateUserSpy.mock.calls).toEqual([[name, password]])
      })
      it('throws error if error not for invalid credentials', async () => {
        const name = 'name'
        const password = 'password'
        const error = Error('invalid')
        const validateUserSpy = jest.spyOn(UserStore, 'validateUser').mockRejectedValue(error)

        await expect(
          (resolvers.Mutation as any).login(
            undefined,
            {
              name,
              password,
            },
            undefined,
            undefined
          )
        ).rejects.toThrow(error)

        expect(validateUserSpy.mock.calls).toEqual([[name, password]])
      })
      it('returns user and sets session if context does not exist', async () => {
        const user = {
          _id: new ObjectId(),
          name: 'name',
          created: new Date(),
        }
        const password = 'password'
        const validateUserSpy = jest.spyOn(UserStore, 'validateUser').mockResolvedValue(user)

        await expect(
          (resolvers.Mutation as any).login(
            undefined,
            {
              name: user.name,
              password,
            },
            undefined,
            undefined
          )
        ).resolves.toEqual(user)

        expect(validateUserSpy.mock.calls).toEqual([[user.name, password]])
      })
      it('returns user and sets session if session does not exist on context', async () => {
        const user = {
          _id: new ObjectId(),
          name: 'name',
          created: new Date(),
        }
        const password = 'password'
        const validateUserSpy = jest.spyOn(UserStore, 'validateUser').mockResolvedValue(user)
        let context = {} // eslint-disable-line prefer-const

        await expect(
          (resolvers.Mutation as any).login(
            undefined,
            {
              name: user.name,
              password,
            },
            context,
            undefined
          )
        ).resolves.toEqual(user)

        expect(context).toEqual({
          session: {
            user,
          },
        })
        expect(validateUserSpy.mock.calls).toEqual([[user.name, password]])
      })
      it('returns user and sets session if user does not exist on context', async () => {
        const _id = new ObjectId()
        const created = new Date()
        const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => created)
        const user = {
          _id,
          name: 'name',
          created,
        }
        const password = 'password'
        const validateUserSpy = jest.spyOn(UserStore, 'validateUser').mockResolvedValue(user)
        // eslint-disable-next-line prefer-const
        let context = {
          session: {},
        }

        await expect(
          (resolvers.Mutation as any).login(
            undefined,
            {
              name: user.name,
              password,
            },
            context,
            undefined
          )
        ).resolves.toEqual(user)

        expect(context).toEqual({
          session: {
            user,
          },
        })
        expect(validateUserSpy.mock.calls).toEqual([[user.name, password]])
        expect(dateSpy.mock.calls).toEqual([])
      })
    })
    describe('logout', () => {
      it('returns true and removes user from session if user exists on session', async () => {
        // eslint-disable-next-line prefer-const
        let context = {
          session: {
            user: {
              name: 'name',
            },
          },
        }

        await expect((resolvers.Mutation as any).logout(undefined, undefined, context, undefined)).resolves.toEqual(
          true
        )

        expect(context).toEqual({
          session: {},
        })
      })
      it('returns false if user does not exist on session', async () => {
        // eslint-disable-next-line prefer-const
        let context = {
          session: {},
        }

        await expect((resolvers.Mutation as any).logout(undefined, undefined, context, undefined)).resolves.toEqual(
          false
        )

        expect(context).toEqual({
          session: {},
        })
      })
    })
  })
})
