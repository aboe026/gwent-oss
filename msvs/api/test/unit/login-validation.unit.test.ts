import LoginValidation from '../../src/graphql/resolvers/mutations/login/login-validation'
import { MutationLoginArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'
import UserStore from '../../src/database/stores/user-store'

describe('login-validation', () => {
  const name = 'user-name'
  const logPrefix = `login for user "${name}"`
  it('throws error if invalid credentials', async () => {
    const message = `Invalid credentials for user "${name}".`
    await testLoginValidation({
      name,
      logPrefix,
      userStoreValidateError: Error(`Invalid credentials for user "${name}"`),
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if unknown error', async () => {
    const error = Error('network timeout')
    await testLoginValidation({
      name,
      logPrefix,
      userStoreValidateError: error,
      expectedError: error,
      errorCalls: [[`${logPrefix} failed: ${error}`]],
    })
  })
  it('returns user if no errors', async () => {
    await testLoginValidation({
      name,
      logPrefix,
    })
  })
  it('logs to trace if enabled', async () => {
    await testLoginValidation({
      name,
      logPrefix,
      traceEnabled: true,
    })
  })
})

async function testLoginValidation({
  logPrefix,
  name,
  userStoreValidateError,
  expectedError,
  errorCalls = [],
  warnCalls = [],
  traceEnabled,
}: {
  logPrefix: string
  name: string
  userStoreValidateError?: Error
  expectedError?: Error
  errorCalls?: string[][]
  warnCalls?: string[][]
  traceEnabled?: boolean
}) {
  const args: MutationLoginArgs = {
    name,
    password: 'password-arg',
  }
  const user = TestUtil.getDbUser({
    name: args.name,
    password: args.password,
  })
  const logRequestInfoSpy = jest.spyOn(ResolverUtil.prototype, 'logRequestInfo').mockImplementation()
  const userStoreValidateSpy = jest.spyOn(UserStore, 'validate')
  if (userStoreValidateError) {
    userStoreValidateSpy.mockRejectedValue(userStoreValidateError)
  } else {
    userStoreValidateSpy.mockResolvedValue(user)
  }
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  LoginValidation['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = LoginValidation.loginValidation(args, null as any)
  if (userStoreValidateError) {
    await expect(promise).rejects.toThrow(expectedError)
  } else {
    await expect(promise).resolves.toEqual({
      logPrefix,
      user,
    })
  }

  expect(logRequestInfoSpy.mock.calls).toEqual([
    [
      {
        args,
        info: null,
        secureKeys: ['password'],
      },
    ],
  ])
  expect(userStoreValidateSpy.mock.calls).toEqual([[args.name, args.password]])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`${logPrefix} user: "${JSON.stringify(user)}"`]] : [])
}
