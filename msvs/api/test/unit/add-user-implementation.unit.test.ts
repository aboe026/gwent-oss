import AddUserImplementation from '../../src/graphql/resolvers/mutations/add-user/add-user-implementation'
import TestUtil from '../util/test-util'
import UserStore from '../../src/database/stores/user-store'

describe('add-user-implementation', () => {
  const logPrefix = 'log-prefix'
  const name = 'name'
  it('throws error if user already exists', async () => {
    const message = `User with name "${name}" already exists.`
    await testAddUserImplementation({
      logPrefix,
      name,
      userStoreAddError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if uknown error', async () => {
    const error = Error('network timeout')
    await testAddUserImplementation({
      logPrefix,
      name,
      userStoreAddError: error,
      errorCalls: [[`${logPrefix} failed: ${error}`]],
    })
  })
  it('returns user if no errors', async () => {
    await testAddUserImplementation({
      logPrefix,
      name,
    })
  })
  it('logs to trace if enabled', async () => {
    await testAddUserImplementation({
      logPrefix,
      name,
      traceEnabled: true,
    })
  })
})

async function testAddUserImplementation({
  logPrefix,
  name,
  userStoreAddError,
  errorCalls = [],
  warnCalls = [],
  traceEnabled,
}: {
  logPrefix: string
  name: string
  userStoreAddError?: Error
  errorCalls?: string[][]
  warnCalls?: string[][]
  traceEnabled?: boolean
}) {
  const password = 'password'
  const user = TestUtil.getDbUser({})
  const userStoreAddSpy = jest.spyOn(UserStore, 'add')
  if (userStoreAddError) {
    userStoreAddSpy.mockRejectedValue(userStoreAddError)
  } else {
    userStoreAddSpy.mockResolvedValue(user)
  }
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  AddUserImplementation['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = AddUserImplementation.addUserImplementation({
    logPrefix,
    name,
    password,
  })
  if (userStoreAddError) {
    await expect(promise).rejects.toThrow(userStoreAddError)
  } else {
    await expect(promise).resolves.toEqual(user)
  }

  expect(userStoreAddSpy.mock.calls).toEqual([[name, password]])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`${logPrefix} user: "${JSON.stringify(user)}"`]] : [])
}
