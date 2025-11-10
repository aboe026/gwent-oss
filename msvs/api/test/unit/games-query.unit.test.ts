import { Context } from '@gwent/graphql-schema/context'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GamesQuery from '../../src/graphql/resolvers/queries/games-query'
import GameStore from '../../src/database/stores/game-store'
import Permissions from '../../src/graphql/permissions'
import TestUtil from '../util/test-util'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'

describe('games-query', () => {
  describe('games', () => {
    it('throws error if isAuthenticated throws error', async () => {
      await testGames({
        isAuthenticatedResponse: Error('isAuthenticated error'),
      })
    })
    it('calls out to GameResolver fromArray', async () => {
      await testGames({
        isAuthenticatedResponse: TestUtil.getDbUser({}),
      })
    })
    it('logs to trace if enabled', async () => {
      await testGames({
        isAuthenticatedResponse: TestUtil.getDbUser({}),
        traceEnabled: true,
      })
    })
  })
})

async function testGames({
  isAuthenticatedResponse,
  traceEnabled,
}: {
  isAuthenticatedResponse: UserDbObject | Error
  traceEnabled?: boolean
}) {
  const context: Context = {
    session: {
      user: isAuthenticatedResponse instanceof Error ? undefined : isAuthenticatedResponse,
    },
  }
  const userId = context.session?.user?._id || ''
  const logPrefix = `games by "${userId}"`
  const game = TestUtil.getDbGame({
    creator: userId,
  })
  const resolvedGame = TestUtil.getGameFromDbGame({
    game,
  })
  const isAuthenticatedSpy = jest.spyOn(Permissions, 'isAuthenticated').mockImplementation(() => {
    if (isAuthenticatedResponse instanceof Error) {
      throw isAuthenticatedResponse
    } else {
      return isAuthenticatedResponse
    }
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

  const promise = GamesQuery.games(context, null as any)
  if (isAuthenticatedResponse instanceof Error) {
    await expect(promise).rejects.toThrow(isAuthenticatedResponse)
  } else {
    await expect(promise).resolves.toEqual([resolvedGame])
  }

  expect(isAuthenticatedSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'games query',
      },
    ],
  ])
  expect(getByUserIdSpy.mock.calls).toEqual(isAuthenticatedResponse instanceof Error ? [] : [[userId]])
  expect(fromArraySpy.mock.calls).toEqual(isAuthenticatedResponse instanceof Error ? [] : [[[game]]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} args: "{}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} games: "${JSON.stringify([game])}"`],
        ]
      : []
  )
}
