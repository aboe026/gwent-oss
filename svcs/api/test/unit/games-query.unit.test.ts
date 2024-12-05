import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GamesQuery from '../../src/graphql/resolvers/queries/games-query'
import GameStore from '../../src/database/stores/game-store'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import TestUtil from '../test-util'

describe('games-query', () => {
  describe('games', () => {
    it('returns error if no user on context', async () => {
      await testGames({
        error: Error(NOT_AUTHENTICATED_MESSAGE),
        errorCalls: [[`No user on context for games query: "${JSON.stringify({})}".`]],
      })
    })
    it('calls out to GameResolver fromArray', async () => {
      await testGames({
        userId: new ObjectId(),
      })
    })
    it('logs to trace if enabled', async () => {
      await testGames({
        userId: new ObjectId(),
        traceEnabled: true,
      })
    })
  })
})

async function testGames({
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
  const logPrefix = `games by "${userId}"`
  const game = TestUtil.getDbGame({
    creator: userId,
  })
  const resolvedGame = TestUtil.getGameFromDbGame({
    game,
  })
  const getByUserIdSpy = jest.spyOn(GameStore, 'getByUserId').mockResolvedValue([game])
  const fromArraySpy = jest.spyOn(GameResolver, 'fromArray').mockResolvedValue([resolvedGame])
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GamesQuery['logger'] = {
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(GamesQuery.games(context, null as any)).resolves.toEqual(error || [resolvedGame])

  expect(getByUserIdSpy.mock.calls).toEqual(error ? [] : [[userId]])
  expect(fromArraySpy.mock.calls).toEqual(error ? [] : [[[game]]])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} games: "${JSON.stringify([game])}"`],
        ]
      : []
  )
}
