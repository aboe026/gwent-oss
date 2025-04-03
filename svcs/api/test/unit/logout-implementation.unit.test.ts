import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import LogoutImplementation from '../../src/graphql/resolvers/mutations/logout/logout-implementation'
import TestUtil from '../util/test-util'

describe('logout-implementation', () => {
  it('returns false if userId undefined', () => {
    testLogoutImplementation({
      context: {
        session: {},
      },
      expected: false,
    })
  })
  it('returns true if userId and no context session user', () => {
    testLogoutImplementation({
      context: {
        session: {},
      },
      userId: new ObjectId(),
      expected: true,
    })
  })
  it('returns true if userId and no context session user', () => {
    const userId = new ObjectId()
    testLogoutImplementation({
      context: {
        session: {
          user: TestUtil.getDbUser({
            id: userId,
          }),
        },
      },
      userId,
      expected: true,
    })
  })
})

function testLogoutImplementation({
  context,
  userId,
  expected,
}: {
  context: Context
  userId?: ObjectId
  expected: boolean
}) {
  const logPrefix = 'log-prefix'
  const debugSpy = jest.fn().mockImplementation()
  LogoutImplementation['logger'] = {
    debug: debugSpy,
  } as any

  expect(
    LogoutImplementation.logoutImplementation({
      context,
      logPrefix,
      userId,
    })
  ).toEqual(expected)
  expect(context.session?.user).toEqual(undefined)

  expect(debugSpy.mock.calls).toEqual(userId ? [[`${logPrefix} removing from session.`]] : [])
}
