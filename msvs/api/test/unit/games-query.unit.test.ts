import { Context } from '@gwent-oss/graphql-schema/context'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GamesQuery from '../../src/graphql/resolvers/queries/games-query'
import GameStore from '../../src/database/stores/game-store'
import Permissions from '../../src/graphql/permissions'
import TestUtil from '../util/test-util'
import { UserDbObject } from '@gwent-oss/graphql-schema/database-typings'

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
  const game1 = TestUtil.getDbGame({
    creator: userId,
  })
  const game2 = TestUtil.getDbGame({
    creator: userId,
  })
  const resolvedGame1 = TestUtil.getGameFromDbGame({
    game: game1,
  })
  const resolvedGame2 = TestUtil.getGameFromDbGame({
    game: game2,
  })
  const maskedGame1 = TestUtil.getGame({})
  const maskedGame2 = TestUtil.getGame({})
  const isAuthenticatedSpy = jest.spyOn(Permissions, 'isAuthenticated').mockImplementation(() => {
    if (isAuthenticatedResponse instanceof Error) {
      throw isAuthenticatedResponse
    } else {
      return isAuthenticatedResponse
    }
  })
  const getByUserIdSpy = jest.spyOn(GameStore, 'getByUserId').mockResolvedValue([game1, game2])
  const fromArraySpy = jest.spyOn(GameResolver, 'fromArray').mockResolvedValue([resolvedGame1, resolvedGame2])
  const maskSpiedHandUnitsSpy = jest
    .spyOn(GameResolver, 'maskSpiedHandUnits')
    .mockReturnValueOnce(maskedGame1)
    .mockReturnValueOnce(maskedGame2)
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
    await expect(promise).resolves.toEqual([maskedGame1, maskedGame2])
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
  expect(fromArraySpy.mock.calls).toEqual(isAuthenticatedResponse instanceof Error ? [] : [[[game1, game2]]])
  expect(maskSpiedHandUnitsSpy.mock.calls).toEqual(
    isAuthenticatedResponse instanceof Error
      ? []
      : [
          [
            {
              game: resolvedGame1,
              userId,
            },
          ],
          [
            {
              game: resolvedGame2,
              userId,
            },
          ],
        ]
  )
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} args: "{}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} games: "${JSON.stringify([game1, game2])}"`],
        ]
      : []
  )
}
