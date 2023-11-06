import { ObjectId } from 'mongodb'

import BasicAuth from '../../src/auth/basic-auth'
import UserStore from '../../src/database/user-store'
import { UserDbObject } from '../../src/database/generated-typings'

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
      const user = {
        _id: new ObjectId(),
        name: 'name',
      }
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
      const user = {
        _id: new ObjectId(),
        name: 'name',
      }
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
  validateUserError,
  validateUserResponse,
  validateUserCalls = [],
  expectedSession,
  nextCalls = [[]],
  error,
}: {
  req: any
  validateUserResponse?: UserDbObject
  validateUserError?: Error
  validateUserCalls?: string[][]
  expectedSession?: any
  nextCalls?: any[][]
  error?: Error
}) {
  const res = {} as any
  const validateUserSpy = jest.spyOn(UserStore, 'validateUser')
  if (validateUserError) {
    validateUserSpy.mockRejectedValue(validateUserError)
  } else if (validateUserResponse) {
    validateUserSpy.mockResolvedValue(validateUserResponse)
  }
  const nextSpy = jest.fn().mockImplementation()

  if (error) {
    await expect(BasicAuth.authenticate(req, res, nextSpy)).rejects.toThrow(error)
  } else {
    await expect(BasicAuth.authenticate(req, res, nextSpy)).resolves.toEqual(undefined)
  }

  expect(validateUserSpy.mock.calls).toEqual(validateUserCalls)
  expect(nextSpy.mock.calls).toEqual(nextCalls)
  expect(req.session).toEqual(expectedSession)
}
