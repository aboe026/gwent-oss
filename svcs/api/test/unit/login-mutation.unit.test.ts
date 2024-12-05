import LoginMutation from '../../src/graphql/resolvers/mutations/login-mutation'
import TestUtil from '../test-util'
import { User } from '@gwent/graphql-schema/resolver-typings'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserStore from '../../src/database/stores/user-store'

describe('login-mutation', () => {
  describe('login', () => {
    const name = 'james.bond@mi6.com'
    const logPrefix = `login for user "${name}"`
    it('returns error if credentials invalid', async () => {
      const error = `Invalid credentials for user "${name}"`
      await testLogin({
        name,
        userValidateResponse: Error(error),
        expected: Error(`${error}.`),
        debugCalls: [[`${logPrefix} failed: ${error}.`]],
      })
    })
    it('throws error if not invalid credentials', async () => {
      const error = Error('Connection refused')
      await testLogin({
        userValidateResponse: error,
        error,
        errorCalls: [[Error(`${logPrefix} failed: ${error}`)]],
      })
    })
    it('sets user on context if context undefined', async () => {
      await testLogin({
        context: undefined,
        additionalTraceCalls: [`${logPrefix}: context not set, defining.`],
      })
    })
    it('sets user on context if context session undefined', async () => {
      await testLogin({
        context: {},
        additionalTraceCalls: [`${logPrefix}: session not set, defining.`],
      })
    })
    it('sets user on context if context session does not have user', async () => {
      await testLogin({
        context: {
          session: {},
        },
        additionalTraceCalls: [`${logPrefix}: setting user on context session.`],
      })
    })
    it('sets user on context if context session already has user', async () => {
      await testLogin({
        context: {
          session: {
            user: TestUtil.getDbUser({}),
          },
        },
        additionalTraceCalls: [`${logPrefix}: setting user on context session.`],
      })
    })
    it('logs to trace if enabled', async () => {
      await testLogin({
        context: {
          session: {
            user: TestUtil.getDbUser({}),
          },
        },
        logPrefix,
        traceEnabled: true,
        additionalTraceCalls: [`${logPrefix}: setting user on context session.`],
      })
    })
  })
})

async function testLogin({
  name = 'james.bond@mi6.com',
  context,
  userValidateResponse = TestUtil.getDbUser({}),
  error,
  expected,
  logPrefix,
  traceEnabled,
  debugCalls = [],
  errorCalls = [],
  additionalTraceCalls = [],
}: {
  name?: string
  context?: any
  userValidateResponse?: UserDbObject | Error
  error?: Error
  expected?: User | Error
  logPrefix?: string
  traceEnabled?: boolean
  debugCalls?: any[][]
  errorCalls?: any[][]
  additionalTraceCalls?: any[]
}) {
  const args = {
    name,
    password: 'secret',
  }
  const validateSpy = jest.spyOn(UserStore, 'validate')
  if (userValidateResponse instanceof Error) {
    validateSpy.mockRejectedValue(userValidateResponse)
  } else {
    validateSpy.mockResolvedValue(userValidateResponse as UserDbObject)
    if (!expected) {
      expected = TestUtil.getUserFromDbUser(userValidateResponse as UserDbObject)
    }
  }
  const traceSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  LoginMutation['logger'] = {
    trace: traceSpy,
    debug: debugSpy,
    error: errorSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = LoginMutation.login(args, context, null as any)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(validateSpy.mock.calls).toEqual([[args.name, args.password]])
  expect(context).toEqual(
    userValidateResponse instanceof Error || !context
      ? undefined
      : {
          session: {
            user: userValidateResponse,
          },
        }
  )
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  const traceCalls: string[][] = []
  if (traceEnabled) {
    traceCalls.push(
      [`${logPrefix} requested fields: "[]"`],
      [`${logPrefix} requested arguments: "[]"`],
      [`${logPrefix} user: "${JSON.stringify(userValidateResponse)}"`]
    )
  }
  if (additionalTraceCalls.length > 0) {
    for (const additionalTraceCall of additionalTraceCalls) {
      traceCalls.push([additionalTraceCall])
    }
  }
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
