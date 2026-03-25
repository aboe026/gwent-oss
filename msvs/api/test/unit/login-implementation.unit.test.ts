import { Context } from '@gwent/graphql-schema/context'
import LoginImplementation from '../../src/graphql/resolvers/mutations/login/login-implementation'
import TestUtil from '../util/test-util'

describe('login-implementation', () => {
  const logPrefix = 'log-prefix'
  it('sets user on context if context undefined', () => {
    testLoginImplementation({
      context: undefined as any as Context,
      logPrefix,
      traceCalls: [[`${logPrefix} context not set, defining.`]],
    })
  })
  it('sets user on context if context does not have session', () => {
    testLoginImplementation({
      context: {},
      logPrefix,
      traceCalls: [[`${logPrefix} session not set, defining.`]],
    })
  })
  it('sets user on context if context has session without user', () => {
    testLoginImplementation({
      context: {
        session: {},
      },
      logPrefix,
      traceCalls: [[`${logPrefix} setting user on context session.`]],
    })
  })
  it('sets user on context if context has session with user', () => {
    testLoginImplementation({
      context: {
        session: {
          user: TestUtil.getDbUser({}),
        },
      },
      logPrefix,
      traceCalls: [[`${logPrefix} overwriting user on context session.`]],
    })
  })
})

function testLoginImplementation({
  context,
  logPrefix,
  traceCalls,
}: {
  logPrefix: string
  context: Context
  traceCalls: string[][]
}) {
  const user = TestUtil.getDbUser({})
  const traceSpy = jest.fn().mockImplementation()
  LoginImplementation['logger'] = {
    trace: traceSpy,
  } as any

  expect(
    LoginImplementation.loginImplementation({
      context,
      logPrefix,
      user,
    })
  ).toEqual({
    session: {
      user,
    },
  })

  if (context) {
    expect(context).toEqual({
      session: {
        user,
      },
    })
  }
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
