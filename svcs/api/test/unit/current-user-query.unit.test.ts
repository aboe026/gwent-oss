import { ObjectId } from 'mongodb'

import CurrentUserQuery from '../../src/graphql/resolvers/queries/current-user-query'
import { User } from '@gwent/graphql-schema/resolver-typings'
import UserResolver from '../../src/graphql/resolvers/types/user-resolver'
import { Context } from '@gwent/graphql-schema/context'
import TestUtil from '../test-util'

describe('current-user-query', () => {
  describe('currentUser', () => {
    it('throws error if session undefined', () => {
      const error = 'No user on session.'
      testCurrentUser({
        context: {},
        error: Error(error),
        warnCalls: [[`currentUser by "undefined" failed: "${error}"`]],
      })
    })
    it('throws error if user undefined', () => {
      const error = 'No user on session.'
      testCurrentUser({
        context: {
          session: {},
        },
        error: Error(error),
        warnCalls: [[`currentUser by "undefined" failed: "${error}"`]],
      })
    })
    it('returns user if defined on session', () => {
      const userId = new ObjectId()
      const created = new Date()
      const name = 'user-name'
      const user = TestUtil.getDbUser({
        id: userId,
        name,
        created,
      })
      testCurrentUser({
        context: {
          session: {
            user,
          },
        },
        userResolverResponse: {
          created,
          id: userId.toString(),
          name,
        },
        userResolverCalls: [[user]],
      })
    })
    it('logs to trace if enabled', () => {
      const userId = new ObjectId()
      const created = new Date()
      const name = 'user-name'
      const user = TestUtil.getDbUser({
        id: userId,
        name,
        created,
      })
      testCurrentUser({
        context: {
          session: {
            user,
          },
        },
        userResolverResponse: {
          created,
          id: userId.toString(),
          name,
        },
        userResolverCalls: [[user]],
        traceEnabled: true,
      })
    })
  })
})

function testCurrentUser({
  context,
  error,
  userResolverResponse,
  userResolverCalls = [],
  traceEnabled,
  warnCalls = [],
}: {
  context: Context
  error?: Error
  userResolverResponse?: User
  userResolverCalls?: any[][]
  traceEnabled?: boolean
  warnCalls?: any[][]
}) {
  const logPrefix = `currentUser by "${context?.session?.user?._id}"`
  const userResolverSpy = jest.spyOn(UserResolver, 'fromObject')
  if (userResolverResponse) {
    userResolverSpy.mockReturnValue(userResolverResponse)
  }
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  CurrentUserQuery['logger'] = {
    warn: warnSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  expect(CurrentUserQuery.currentUser(context, null as any)).toEqual(error || userResolverResponse)

  expect(userResolverSpy.mock.calls).toEqual(userResolverCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} user: "${JSON.stringify(context?.session?.user)}"`],
        ]
      : []
  )
}
