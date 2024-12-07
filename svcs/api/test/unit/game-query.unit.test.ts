import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import GameQuery from '../../src/graphql/resolvers/queries/game-query'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import { QueryGameArgs } from '@gwent/graphql-schema/resolver-typings'
import TestUtil from '../test-util'

describe('game-query', () => {
  describe('game', () => {
    const userId = new ObjectId()
    it('returns error if no user on context', async () => {
      await testGame({
        error: Error(NOT_AUTHENTICATED_MESSAGE),
        errorCalls: [[`No user on context for game query: "${JSON.stringify({})}".`]],
      })
    })
    it('returns error if invalid game ID', async () => {
      const gameId = 'invalid'
      const message = `Game ID "${gameId}" is not a valid MongoDB ObjectId.`
      await testGame({
        userId,
        gameId,
        error: Error(message),
        warnCalls: [[`game by "${userId}" failed: ${message}`]],
      })
    })
    it('returns resolved game if found', async () => {
      await testGame({
        userId,
      })
    })
    it('logs to trace if enabled', async () => {
      await testGame({
        userId,
        traceEnabled: true,
      })
    })
  })
})

async function testGame({
  userId,
  gameId = new ObjectId().toString(),
  error,
  errorCalls = [],
  warnCalls = [],
  traceEnabled,
}: {
  userId?: ObjectId
  gameId?: string
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
  const logPrefix = `game by "${context.session?.user?._id}"`
  const game = TestUtil.getGame({
    id: gameId,
  })
  const args: QueryGameArgs = {
    id: gameId,
  }
  const fromIdSpy = jest.spyOn(GameResolver, 'fromId').mockResolvedValue(game)
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GameQuery['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(GameQuery.game(args, context, null as any)).resolves.toEqual(error || game)

  expect(fromIdSpy.mock.calls).toEqual(error ? [] : [[gameId]])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
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
