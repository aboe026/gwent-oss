import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import GameQuery from '../../src/graphql/resolvers/queries/game-query'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import { QueryGameArgs } from '@gwent/graphql-schema/resolver-typings'
import Permissions, { GameAndPlayer } from '../../src/graphql/permissions'
import TestUtil from '../util/test-util'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'

describe('game-query', () => {
  describe('game', () => {
    const gameId = new ObjectId().toString()
    it('throws error if isAuthenticated throws error', async () => {
      await testGame({
        isAuthenticatedResponse: Error('isAuthenticated error'),
      })
    })
    it('throws error if isGamePlayer throws error', async () => {
      await testGame({
        isAuthenticatedResponse: TestUtil.getDbUser({}),
        isGamePlayerResponse: Error('isGamePlayer error'),
      })
    })
    it('returns resolved game if found', async () => {
      const game = TestUtil.getDbGame({
        id: gameId,
      })
      await testGame({
        gameId,
        isAuthenticatedResponse: TestUtil.getDbUser({}),
        isGamePlayerResponse: {
          game,
          player: game.players[0],
        },
      })
    })
  })
})

async function testGame({
  isAuthenticatedResponse,
  isGamePlayerResponse: isGamePlayerResponse,
  gameId = new ObjectId().toString(),
}: {
  isAuthenticatedResponse: UserDbObject | Error
  isGamePlayerResponse?: GameAndPlayer | Error
  gameId?: string
}) {
  const context: Context = {
    session: {
      user: isAuthenticatedResponse instanceof Error ? undefined : isAuthenticatedResponse,
    },
  }
  const resolvedGame = TestUtil.getGame({
    id: gameId,
  })
  const args: QueryGameArgs = {
    id: gameId,
  }
  const isAuthenticatedSpy = jest.spyOn(Permissions, 'isAuthenticated').mockImplementation(() => {
    if (isAuthenticatedResponse instanceof Error) {
      throw isAuthenticatedResponse
    } else {
      return isAuthenticatedResponse
    }
  })
  const isGamePlayerSpy = jest.spyOn(Permissions, 'isGamePlayer')
  if (isGamePlayerResponse) {
    if (isGamePlayerResponse instanceof Error) {
      isGamePlayerSpy.mockRejectedValue(isGamePlayerResponse)
    } else {
      isGamePlayerSpy.mockResolvedValue(isGamePlayerResponse)
    }
  }
  const fromObjectSpy = jest.spyOn(GameResolver, 'fromObject').mockResolvedValue(resolvedGame)

  const promise = GameQuery.game(args, context, null as any)
  const error =
    isAuthenticatedResponse instanceof Error
      ? isAuthenticatedResponse
      : isGamePlayerResponse instanceof Error
        ? isGamePlayerResponse
        : undefined
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(resolvedGame)
  }

  expect(isAuthenticatedSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'game query',
      },
    ],
  ])
  expect(isGamePlayerSpy.mock.calls).toEqual(
    isAuthenticatedResponse instanceof Error
      ? []
      : [
          [
            {
              gameId,
              userId: isAuthenticatedResponse instanceof Error ? '' : isAuthenticatedResponse._id,
              label: 'game query',
            },
          ],
        ]
  )
  expect(fromObjectSpy.mock.calls).toEqual(
    error
      ? []
      : [
          [
            {
              game: isGamePlayerResponse instanceof Error ? undefined : isGamePlayerResponse?.game,
            },
          ],
        ]
  )
}
