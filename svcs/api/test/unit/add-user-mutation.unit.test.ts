import AddUserMutation from '../../src/graphql/resolvers/mutations/add-user/add-user-mutation'
import { MutationAddUserArgs, User } from '@gwent/graphql-schema/resolver-typings'
import TestUtil from '../util/test-util'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserStore from '../../src/database/stores/user-store'

describe('add-user-mutation', () => {
  describe('addUser', () => {
    const name = 'james.bond@mi6.com'
    it('throws error if user already exists', async () => {
      const error = `User with name "${name}" already exists.`
      await testAddUser({
        name,
        userAddResponse: Error(error),
        expected: Error(error),
      })
    })
    it('throws error if not about user already existing', async () => {
      const error = Error('Connection refused')
      await testAddUser({
        name,
        userAddResponse: error,
        expected: error,
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
      })
    })
  })
})

async function testAddUser({
  name = 'james.bond@mi6.com',
  userAddResponse,
  expected,
}: {
  name?: string
  userAddResponse: UserDbObject | Error
  expected?: User | Error
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

  const promise = AddUserMutation.addUserMutation(args, null as any)
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(addSpy.mock.calls).toEqual([[args.name, args.password]])
}
