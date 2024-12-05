import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import GameQuery from '../../src/graphql/resolvers/queries/game-query'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import { QueryGameArgs } from '@gwent/graphql-schema/resolver-typings'
import TestUtil from '../test-util'

describe('game-query', () => {
  describe('game', () => {
    it('returns error if no user on context', async () => {
      await testGame({
        error: Error(NOT_AUTHENTICATED_MESSAGE),
        errorCalls: [[`No user on context for game query: "${JSON.stringify({})}".`]],
      })
    })
    it('returns resolved game if found', async () => {
      await testGame({
        userId: new ObjectId(),
      })
    })
    it('logs to trace if enabled', async () => {
      await testGame({
        userId: new ObjectId(),
        traceEnabled: true,
      })
    })
  })
})

async function testGame({
  userId,
  error,
  errorCalls = [],
  traceEnabled,
}: {
  userId?: ObjectId
  error?: Error
  errorCalls?: any[][]
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
  const logPrefix = `game by "${context.session?.user?._id}"`
  const gameId = new ObjectId().toString()
  const game = TestUtil.getGame({
    id: gameId,
  })
  const args: QueryGameArgs = {
    id: gameId,
  }
  const fromIdSpy = jest.spyOn(GameResolver, 'fromId').mockResolvedValue(game)
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GameQuery['logger'] = {
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(GameQuery.game(args, context, null as any)).resolves.toEqual(error || game)

  expect(fromIdSpy.mock.calls).toEqual(error ? [] : [[gameId]])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} args: "${JSON.stringify({ id: gameId })}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
        ]
      : []
  )
}
