import AddUserMutation from '../../src/graphql/resolvers/mutations/add-user-mutation'
import { User } from '@gwent/graphql-schema/resolver-typings'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import TestUtil from '../test-util'
import UserStore from '../../src/database/stores/user-store'

describe('add-use-mutation', () => {
  describe('addUser', () => {
    const name = 'james.bond@mi6.com'
    const logPrefix = `addUser for user "${name}"`
    it('returns error if user already exists', async () => {
      const error = `User with name "${name}" already exists.`
      await testAddUser({
        name,
        userAddResponse: Error(error),
        expected: Error(error),
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if not about user already existing', async () => {
      const error = Error('Connection refused')
      await testAddUser({
        name,
        userAddResponse: error,
        error,
        errorCalls: [[Error(`${logPrefix} failed: ${error}`)]],
      })
    })
    it('returns user if no error', async () => {
      const user = TestUtil.getDbUser({
        name,
      })
      await testAddUser({
        name,
        userAddResponse: user,
        expected: TestUtil.getUserFromDbUser(user),
      })
    })
    it('logs to trace if enabled', async () => {
      const user = TestUtil.getDbUser({
        name,
      })
      await testAddUser({
        name,
        userAddResponse: user,
        expected: TestUtil.getUserFromDbUser(user),
        logPrefix,
        traceEnabled: true,
      })
    })
  })
})

async function testAddUser({
  name = 'james.bond@mi6.com',
  userAddResponse,
  error,
  expected,
  logPrefix,
  traceEnabled,
  debugCalls = [],
  errorCalls = [],
}: {
  name?: string
  userAddResponse: UserDbObject | Error
  error?: Error
  expected?: User | Error
  logPrefix?: string
  traceEnabled?: boolean
  debugCalls?: any[][]
  errorCalls?: any[][]
}) {
  const args = {
    name,
    password: 'secret',
  }
  const addSpy = jest.spyOn(UserStore, 'add')
  if (userAddResponse instanceof Error) {
    addSpy.mockRejectedValue(userAddResponse)
  } else {
    addSpy.mockResolvedValue(userAddResponse)
  }
  const traceSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  AddUserMutation['logger'] = {
    trace: traceSpy,
    debug: debugSpy,
    error: errorSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = AddUserMutation.addUser(args, null as any)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(addSpy.mock.calls).toEqual([[args.name, args.password]])
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} user: "${JSON.stringify(userAddResponse)}"`],
        ]
      : []
  )
}
