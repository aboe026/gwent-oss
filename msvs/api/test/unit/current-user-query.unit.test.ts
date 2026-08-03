import { Context } from '@gwent-oss/graphql-schema/context'
import CurrentUserQuery from '../../src/graphql/resolvers/queries/current-user-query'
import Permissions from '../../src/graphql/permissions'
import TestUtil from '../util/test-util'
import { User } from '@gwent-oss/graphql-schema/resolver-typings'
import { UserDbObject } from '@gwent-oss/graphql-schema/database-typings'
import UserResolver from '../../src/graphql/resolvers/types/user-resolver'

describe('current-user-query', () => {
  describe('currentUser', () => {
    it('throws error if isAuthenticated throws error', () => {
      const error = Error('isAuthenticated error')
      testCurrentUser({
        isAuthenticatedResponse: error,
        expected: error,
      })
    })
    it('returns user if no errors', () => {
      const user = TestUtil.getDbUser({})
      testCurrentUser({
        isAuthenticatedResponse: user,
        expected: TestUtil.getUserFromDbUser(user),
      })
    })
  })
})

function testCurrentUser({
  isAuthenticatedResponse,
  expected,
}: {
  isAuthenticatedResponse: UserDbObject | Error
  expected: User | Error
}) {
  const context: Context = {
    session: {
      user: isAuthenticatedResponse instanceof Error ? undefined : isAuthenticatedResponse,
    },
  }
  const isAuthenticatedSpy = jest.spyOn(Permissions, 'isAuthenticated').mockImplementation(() => {
    if (isAuthenticatedResponse instanceof Error) {
      throw isAuthenticatedResponse
    } else {
      return isAuthenticatedResponse
    }
  })
  const userResolverSpy = jest.spyOn(UserResolver, 'fromObject')
  if (!(expected instanceof Error)) {
    userResolverSpy.mockReturnValue(expected)
  }

  if (expected instanceof Error) {
    expect(() => CurrentUserQuery.currentUser(context, null as any)).toThrow(expected)
  } else {
    expect(CurrentUserQuery.currentUser(context, null as any)).toEqual(expected)
  }

  expect(isAuthenticatedSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'currentUser query',
      },
    ],
  ])
  expect(userResolverSpy.mock.calls).toEqual(expected instanceof Error ? [] : [[isAuthenticatedResponse]])
}
