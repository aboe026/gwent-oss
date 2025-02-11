import AddUserMutation from '../../src/graphql/resolvers/mutations/add-user-mutation'
import { MutationAddUserArgs, User } from '@gwent/graphql-schema/resolver-typings'
import { REDACTED } from '@gwent/constants'
import TestUtil from '../test-util'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserStore from '../../src/database/stores/user-store'

describe('add-user-mutation', () => {
  describe('addUser', () => {
    const name = 'james.bond@mi6.com'
    const logPrefix = `addUser for user "${name}"`
    it('throws error if user already exists', async () => {
      const error = `User with name "${name}" already exists.`
      await testAddUser({
        name,
        userAddResponse: Error(error),
        expected: Error(error),
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if not about user already existing', async () => {
      const error = Error('Connection refused')
      await testAddUser({
        name,
        userAddResponse: error,
        expected: error,
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
  expected,
  logPrefix,
  traceEnabled,
  warnCalls = [],
  errorCalls = [],
}: {
  name?: string
  userAddResponse: UserDbObject | Error
  expected?: User | Error
  logPrefix?: string
  traceEnabled?: boolean
  warnCalls?: any[][]
  errorCalls?: any[][]
}) {
  const args: MutationAddUserArgs = {
    name,
    password: 'secret',
  }
  const addSpy = jest.spyOn(UserStore, 'add')
  if (userAddResponse instanceof Error) {
    addSpy.mockRejectedValue(userAddResponse)
  } else {
    addSpy.mockResolvedValue(userAddResponse)
  }
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  AddUserMutation['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  const promise = AddUserMutation.addUser(args, null as any)
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(addSpy.mock.calls).toEqual([[args.name, args.password]])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `${logPrefix} args: "${JSON.stringify({
              name: args.name,
              password: REDACTED,
            })}"`,
          ],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} user: "${JSON.stringify(userAddResponse)}"`],
        ]
      : []
  )
}
