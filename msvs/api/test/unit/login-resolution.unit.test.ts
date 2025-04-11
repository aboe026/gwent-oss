import LoginResolution from '../../src/graphql/resolvers/mutations/login/login-resolution'
import TestUtil from '../util/test-util'
import UserResolver from '../../src/graphql/resolvers/types/user-resolver'

describe('login-resolution', () => {
  it('returns resolved user', async () => {
    await testLoginResolution({})
  })
  it('logs to trace if enabled', async () => {
    await testLoginResolution({
      traceEnabled: true,
    })
  })
})

async function testLoginResolution({ traceEnabled }: { traceEnabled?: boolean }) {
  const logPrefix = 'log-prefix'
  const user = TestUtil.getDbUser({})
  const resolvedUser = TestUtil.getUserFromDbUser(user)
  const userResolverFromObjectSpy = jest.spyOn(UserResolver, 'fromObject').mockReturnValue(resolvedUser)
  const traceSpy = jest.fn().mockImplementation()
  LoginResolution['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  expect(
    LoginResolution.loginResolution({
      logPrefix,
      user,
    })
  ).toEqual(resolvedUser)

  expect(userResolverFromObjectSpy.mock.calls).toEqual([[user]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`${logPrefix} resolvedUser: "${JSON.stringify(resolvedUser)}"`]] : []
  )
}
