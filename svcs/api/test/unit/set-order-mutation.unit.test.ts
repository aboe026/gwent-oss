import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { MutationSetOrderArgs } from '@gwent/graphql-schema/resolver-typings'
import MutationUtil from '../../src/graphql/resolvers/mutations/mutation-util'
import SetOrderMutation from '../../src/graphql/resolvers/mutations/set-order-mutation'
import TestUtil from '../test-util'

describe('set-order-mutation', () => {
  describe('setOrder', () => {
    const userId = new ObjectId()
    it('calls to private setOrder method when userIds not specified', async () => {
      await testSetOrder({
        userId,
      })
    })
    it('calls to private setOrder method when userIds are specified', async () => {
      await testSetOrder({
        userId,
        userIds: [userId.toString(), new ObjectId().toString()],
      })
    })
    it('logs to trace if enabled', async () => {
      await testSetOrder({
        userId,
        traceEnabled: true,
      })
    })
  })
})

async function testSetOrder({
  userId,
  gameId = new ObjectId().toString(),
  userIds,
  error,
  errorCalls = [],
  warnCalls = [],
  traceEnabled,
}: {
  userId?: string | ObjectId
  gameId?: string
  userIds?: string[]
  error?: Error
  errorCalls?: any[][]
  warnCalls?: any[][]
  traceEnabled?: boolean
}) {
  const context: Context = {
    session: {},
  }
  if (userId && context.session) {
    context.session.user = TestUtil.getDbUser({
      id: userId,
    })
  }
  const args: MutationSetOrderArgs = {
    game: gameId,
    users: userIds,
  }
  const logPrefix = `setOrder by "${userId}"`
  const resolvedGame = TestUtil.getGame({
    id: gameId,
  })
  const setOrderSpy = jest.spyOn(MutationUtil.prototype, 'setGameTurnOrder').mockResolvedValue(resolvedGame)
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SetOrderMutation['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
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
              userIds,
              allowImplicit: true,
            },
          ],
        ]
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
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
