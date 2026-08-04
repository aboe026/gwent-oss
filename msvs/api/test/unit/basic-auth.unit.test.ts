import BasicAuth from '../../src/auth/basic-auth'
import TestUtil from '../util/test-util'
import { UserDbObject } from '@gwent-oss/graphql-schema/database-typings'
import UserStore from '../../src/database/stores/user-store'

describe('basic-auth', () => {
  describe('authenticate', () => {
    it('does not set user on session if basic auth fails', async () => {
      await testBasicAuth({
        req: {
          headers: {},
        },
        validateUserCalls: [],
        nextCalls: [[]],
      })
    })
    it('does not call next if not defined', async () => {
      await testBasicAuth({
        req: {
          headers: {},
        },
        next: false,
        validateUserCalls: [],
        nextCalls: [],
      })
    })
    it('throws error if validate user fails', async () => {
      const name = 'name'
      const password = 'password'
      const error = Error('invalid')
      await testBasicAuth({
        req: {
          headers: {
            authorization: `Basic ${Buffer.from(`${name}:${password}`).toString('base64')}`,
          },
        },
        validateUserError: error,
        validateUserCalls: [[name, password]],
        nextCalls: [],
        error,
      })
    })
    it('sets user on session if validate user passes and session does not exist', async () => {
      const password = 'password'
      const user = TestUtil.getDbUser({
        password: '',
      })
      await testBasicAuth({
        req: {
          headers: {
            authorization: `Basic ${Buffer.from(`${user.name}:${password}`).toString('base64')}`,
          },
        },
        validateUserCalls: [[user.name, password]],
        validateUserResponse: user,
        expectedSession: { user },
      })
    })
    it('sets user on session if validate user passes and session not exists', async () => {
      const password = 'password'
      const user = TestUtil.getDbUser({
        password: '',
      })
      await testBasicAuth({
        req: {
          headers: {
            authorization: `Basic ${Buffer.from(`${user.name}:${password}`).toString('base64')}`,
          },
          session: {},
        },
        validateUserCalls: [[user.name, password]],
        validateUserResponse: user,
        expectedSession: { user },
      })
    })
  })
})

async function testBasicAuth({
  req,
  next = true,
  validateUserError,
  validateUserResponse,
  validateUserCalls = [],
  expectedSession,
  nextCalls = [[]],
  error,
}: {
  req: any
  next?: boolean
  validateUserResponse?: UserDbObject
  validateUserError?: Error
  validateUserCalls?: string[][]
  expectedSession?: any
  nextCalls?: any[][]
  error?: Error
}) {
  const res = {} as any
  const validateUserSpy = jest.spyOn(UserStore, 'validate')
  if (validateUserError) {
    validateUserSpy.mockRejectedValue(validateUserError)
  } else if (validateUserResponse) {
    validateUserSpy.mockResolvedValue(validateUserResponse)
  }
  const nextSpy = jest.fn().mockImplementation()

  const promise = next ? BasicAuth.authenticate(req, res, nextSpy) : BasicAuth.authenticate(req, res)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(undefined)
  }

  expect(validateUserSpy.mock.calls).toEqual(validateUserCalls)
  expect(nextSpy.mock.calls).toEqual(nextCalls)
  expect(req.session).toEqual(expectedSession)
}
