import { Context } from '@gwent-oss/graphql-schema/context'
import LogoutValidation, { ValidatedLogout } from '../../src/graphql/resolvers/mutations/logout/logout-validation'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('logout-validation', () => {
  it('returns object if no user on context', () => {
    testLogoutValidation({
      context: {
        session: {},
      },
      expected: {
        logPrefix: 'logout for user "undefined"',
        userId: undefined,
      },
    })
  })
  it('returns object if user on context', () => {
    const user = TestUtil.getDbUser({})
    testLogoutValidation({
      context: {
        session: {
          user,
        },
      },
      expected: {
        logPrefix: `logout for user "${user._id}"`,
        userId: user._id,
      },
    })
  })
})

function testLogoutValidation({ context, expected }: { context: Context; expected: ValidatedLogout }) {
  const logRequestInfoSpy = jest.spyOn(ResolverUtil.prototype, 'logRequestInfo').mockImplementation()

  expect(LogoutValidation.logoutValidation(context, null as any)).toEqual(expected)

  expect(logRequestInfoSpy.mock.calls).toEqual([
    [
      {
        info: null,
      },
    ],
  ])
}
