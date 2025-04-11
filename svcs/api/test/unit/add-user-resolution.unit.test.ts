import AddUserResolution from '../../src/graphql/resolvers/mutations/add-user/add-user-resolution'
import TestUtil from '../util/test-util'
import UserResolver from '../../src/graphql/resolvers/types/user-resolver'

describe('add-user-resolution', () => {
  it('returns resolved user', () => {
    testAddUserResolution({})
  })
  it('logs to trace if enabled', () => {
    testAddUserResolution({
      traceEnabled: true,
    })
  })
})

function testAddUserResolution({ traceEnabled }: { traceEnabled?: boolean }) {
  const logPrefix = 'log-prefix'
  const user = TestUtil.getDbUser({})
  const resolvedUser = TestUtil.getUserFromDbUser(user)
  const userResolverFromObjectSpy = jest.spyOn(UserResolver, 'fromObject').mockReturnValue(resolvedUser)
  const traceSpy = jest.fn().mockImplementation()
  AddUserResolution['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  expect(
    AddUserResolution.addUserResolution({
      logPrefix,
      user,
    })
  ).toEqual(resolvedUser)

  expect(userResolverFromObjectSpy.mock.calls).toEqual([[user]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`${logPrefix} resolvedUser: "${JSON.stringify(resolvedUser)}"`]] : []
  )
}
