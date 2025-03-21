import LoginMutation from '../../src/graphql/resolvers/mutations/login-mutation'
import { MutationLoginArgs, User } from '@gwent/graphql-schema/resolver-typings'
import { REDACTED } from '@gwent/constants'
import TestUtil from '../util/test-util'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserStore from '../../src/database/stores/user-store'

describe('login-mutation', () => {
  describe('login', () => {
    const name = 'james.bond@mi6.com'
    const logPrefix = `login for user "${name}"`
    it('throws error if credentials invalid', async () => {
      const error = `Invalid credentials for user "${name}"`
      await testLogin({
        name,
        userValidateResponse: Error(error),
        error: Error(`${error}.`),
        warnCalls: [[`${logPrefix} failed: ${error}.`]],
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
  logPrefix,
  errorCalls = [],
  warnCalls = [],
  traceEnabled,
  additionalTraceCalls = [],
}: {
  name?: string
  context?: any
  userValidateResponse?: UserDbObject | Error
  error?: Error
  logPrefix?: string
  errorCalls?: any[][]
  warnCalls?: any[][]
  traceEnabled?: boolean
  additionalTraceCalls?: any[]
}) {
  const args: MutationLoginArgs = {
    name,
    password: 'secret',
  }
  let user: User | undefined
  const validateSpy = jest.spyOn(UserStore, 'validate')
  if (userValidateResponse instanceof Error) {
    validateSpy.mockRejectedValue(userValidateResponse)
  } else {
    validateSpy.mockResolvedValue(userValidateResponse as UserDbObject)
    user = TestUtil.getUserFromDbUser(userValidateResponse as UserDbObject)
  }
  const traceSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  LoginMutation['logger'] = {
    trace: traceSpy,
    warn: warnSpy,
    error: errorSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = LoginMutation.login(args, context, null as any)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(user)
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
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  const traceCalls: string[][] = []
  if (traceEnabled) {
    traceCalls.push(
      [
        `${logPrefix} args: "${JSON.stringify({
          name,
          password: REDACTED,
        })}"`,
      ],
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
