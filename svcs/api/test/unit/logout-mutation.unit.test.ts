import LogoutMutation from '../../src/graphql/resolvers/mutations/logout-mutation'
import TestUtil from '../test-util'

describe('logout-mutation', () => {
  describe('logout', () => {
    const user = TestUtil.getDbUser({})
    const logPrefix = `logout for user "${user._id}"`
    it('returns false if no session on context', () => {
      testLogout({
        context: {},
        expected: false,
      })
    })
    it('returns false if no user on session', () => {
      testLogout({
        context: {
          session: {},
        },
        expected: false,
      })
    })
    it('removes user from session and returns true if user on session', () => {
      testLogout({
        context: {
          session: {
            user,
          },
        },
        expected: true,
        debugCalls: [[`${logPrefix}: removing from session.`]],
      })
    })
    it('logs to trace if enabled', async () => {
      testLogout({
        context: {
          session: {
            user,
          },
        },
        expected: true,
        debugCalls: [[`${logPrefix}: removing from session.`]],
        logPrefix,
        traceEnabled: true,
      })
    })
  })
})

function testLogout({
  context,
  expected,
  logPrefix,
  traceEnabled,
  debugCalls = [],
}: {
  context?: any
  expected: boolean
  logPrefix?: string
  traceEnabled?: boolean
  debugCalls?: any[][]
}) {
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  LogoutMutation['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  expect(LogoutMutation.logout(context, null as any)).toEqual(expected)

  expect(context?.session?.user).toEqual(undefined)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`${logPrefix} requested fields: "[]"`], [`${logPrefix} requested arguments: "[]"`]] : []
  )
}
