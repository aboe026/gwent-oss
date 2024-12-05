import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import MutationUtil from '../../src/graphql/resolvers/mutations/mutation-util'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import SetOrderMutation from '../../src/graphql/resolvers/mutations/set-order-mutation'
import TestUtil from '../test-util'

describe('set-order-mutation', () => {
  describe('setOrder', () => {
    it('returns error if no user on context', async () => {
      await testSetOrder({
        error: Error(NOT_AUTHENTICATED_MESSAGE),
        errorCalls: [[`No user on context for setOrder mutation: "${JSON.stringify({})}".`]],
      })
    })
    it('calls to private setOrder method when userIds not specified', async () => {
      await testSetOrder({
        userId: new ObjectId(),
      })
    })
    it('calls to private setOrder method when userIds are specified', async () => {
      const userId = new ObjectId()
      await testSetOrder({
        userId,
        userIds: [userId.toString(), new ObjectId().toString()],
      })
    })
    it('logs to trace if enabled', async () => {
      await testSetOrder({
        userId: new ObjectId(),
        traceEnabled: true,
      })
    })
  })
})

async function testSetOrder({
  userId,
  userIds,
  error,
  errorCalls = [],
  traceEnabled,
}: {
  userId?: string | ObjectId
  userIds?: string[]
  error?: Error
  errorCalls?: any[][]
  traceEnabled?: boolean
}) {
  const gameId = new ObjectId().toString()
  const context: Context = {
    session: {},
  }
  if (userId && context.session) {
    context.session.user = TestUtil.getDbUser({
      id: userId,
    })
  }
  const args = {
    game: gameId,
    users: userIds,
  }
  const logPrefix = `setOrder by "${userId}"`
  const resolvedGame = TestUtil.getGame({
    id: gameId,
  })
  const setOrderSpy = jest.spyOn(MutationUtil, 'setGameTurnOrder').mockResolvedValue(resolvedGame)
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SetOrderMutation['logger'] = {
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(SetOrderMutation.setOrder(args, context, null as any)).resolves.toEqual(error || resolvedGame)

  expect(setOrderSpy.mock.calls).toEqual(
    error
      ? []
      : [
          [
            {
              userId,
              gameId,
              logPrefix,
              userIds,
              allowImplicit: true,
            },
          ],
        ]
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} args: "${JSON.stringify(args)}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
        ]
      : []
  )
}
