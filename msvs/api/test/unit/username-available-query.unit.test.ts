import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'
import { UserDbObject } from '@gwent-oss/graphql-schema/database-typings'
import UsernameAvailableQuery from '../../src/graphql/resolvers/queries/username-available'
import { USERNAME_REQUIREMENTS } from '@gwent-oss/constants'
import UserStore from '../../src/database/stores/user-store'

describe('username-available', () => {
  describe('invalid', () => {
    it('throws error if name too short', async () => {
      const name = 'hi'
      const message = `Invalid name "${name}": Length "${name.length}" less than minimum length "${USERNAME_REQUIREMENTS.Min}"`
      await testUsernameAvailable({
        name,
        expected: Error(message),
        warnCalls: [[`usernameAvailable by "undefined" failed: ${message}`]],
      })
    })
    it('throws error if name too long', async () => {
      const name = '123456789012345678901234567890123456789012345678901'
      const message = `Invalid name "${name}": Length "${name.length}" greater than maximum length "${USERNAME_REQUIREMENTS.Max}"`
      await testUsernameAvailable({
        name,
        expected: Error(message),
        warnCalls: [[`usernameAvailable by "undefined" failed: ${message}`]],
      })
    })
    it('throws error if name contains spaces', async () => {
      const name = 'sp aces'
      const message = `Invalid name "${name}": Cannot contain spaces`
      await testUsernameAvailable({
        name,
        expected: Error(message),
        warnCalls: [[`usernameAvailable by "undefined" failed: ${message}`]],
      })
    })
    it('throws error if name contains invalid special characters', async () => {
      const name = 'sp$cial'
      const message = `Invalid name "${name}": Contains invalid characters "$"`
      await testUsernameAvailable({
        name,
        expected: Error(message),
        warnCalls: [[`usernameAvailable by "undefined" failed: ${message}`]],
      })
    })
  })
  describe('valid', () => {
    it('returns true if no user with name exists', async () => {
      await testUsernameAvailable({
        name: 'valid',
        getUserByNameResponse: null,
        expected: true,
      })
    })
    it('returns false if user with name exists', async () => {
      await testUsernameAvailable({
        name: 'valid',
        getUserByNameResponse: TestUtil.getDbUser({}),
        expected: false,
      })
    })
  })
})

async function testUsernameAvailable({
  name,
  getUserByNameResponse = null,
  expected,
  warnCalls = [],
}: {
  name: string
  getUserByNameResponse?: UserDbObject | null
  expected: boolean | Error
  warnCalls?: string[][]
}) {
  const logRequestInfoSpy = jest.spyOn(ResolverUtil.prototype, 'logRequestInfo').mockImplementation()
  const getUserByNameSpy = jest.spyOn(UserStore, 'getByName').mockResolvedValue(getUserByNameResponse)
  const warnSpy = jest.fn().mockImplementation()
  UsernameAvailableQuery['logger'] = {
    warn: warnSpy,
  } as any

  const promise = UsernameAvailableQuery.usernameAvailable({ name }, {}, null as any)
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(logRequestInfoSpy.mock.calls).toEqual([
    [
      {
        info: null,
      },
    ],
  ])
  expect(getUserByNameSpy.mock.calls).toEqual(
    expected instanceof Error
      ? []
      : [
          [
            name,
            {
              projection: {
                _id: 1,
              },
            },
          ],
        ]
  )
  expect(warnSpy.mock.calls).toEqual(warnCalls)
}
