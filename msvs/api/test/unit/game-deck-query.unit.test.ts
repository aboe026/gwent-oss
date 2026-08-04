import { ObjectId } from 'mongodb'

import { Context } from '@gwent-oss/graphql-schema/context'
import { GameDeck, QueryGameDeckArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import GameDeckQuery from '../../src/graphql/resolvers/queries/game-deck-query'
import GameDeckResolver from '../../src/graphql/resolvers/types/game-deck-resolver'
import Permissions, { GameAndPlayer } from '../../src/graphql/permissions'
import TestUtil from '../util/test-util'
import { UserDbObject } from '@gwent-oss/graphql-schema/database-typings'

describe('game-deck-query', () => {
  describe('gameDeck', () => {
    const userId = new ObjectId()
    const gameId = new ObjectId().toString()
    const logPrefix = `gameDeck by "${userId}" for game "${gameId}"`
    const gamePlayer = TestUtil.getDbGamePlayer({
      user: userId,
    })
    const game = TestUtil.getDbGame({
      id: gameId,
      creator: userId,
      players: [gamePlayer],
    })
    it('throws error if isAuthenticated throws error', async () => {
      await testGameDeck({
        gameId,
        isAuthenticatedResponse: Error('isAuthenticated error'),
      })
    })
    it('throws error if isGamePlayer throws error', async () => {
      await testGameDeck({
        gameId,
        isAuthenticatedResponse: TestUtil.getDbUser({
          id: userId,
        }),
        isGamePlayerResponse: Error('isGamePlayer error'),
      })
    })
    it('returns undefined if player deck not set', async () => {
      await testGameDeck({
        gameId: gameId.toString(),
        isAuthenticatedResponse: TestUtil.getDbUser({
          id: userId,
        }),
        isGamePlayerResponse: {
          game,
          player: gamePlayer,
        },
        expected: null,
        traceCalls: [[`${logPrefix} does not have deck, nothing to resolve.`]],
      })
    })
    it('returns game deck if player deck is set', async () => {
      const deck = TestUtil.getDbDeck({
        user: userId,
      })
      const playerDeck = TestUtil.getDbGameDeck({
        from: deck,
      })
      const gameDeck = TestUtil.getGameDeck({
        from: TestUtil.getDeckFromDbDeck({
          deck,
        }),
      })
      await testGameDeck({
        gameId: gameId.toString(),
        isAuthenticatedResponse: TestUtil.getDbUser({
          id: userId,
        }),
        isGamePlayerResponse: {
          game,
          player: {
            ...gamePlayer,
            deck: playerDeck,
          },
        },
        expected: gameDeck,
        gameDeckResolverCalls: [
          [
            {
              gameDeck: playerDeck,
            },
          ],
        ],
        traceCalls: [[`${logPrefix} has deck "${deck._id}", resolving.`]],
      })
    })
    it('logs to trace if enabled', async () => {
      await testGameDeck({
        gameId: gameId.toString(),
        isAuthenticatedResponse: TestUtil.getDbUser({
          id: userId,
        }),
        isGamePlayerResponse: {
          game,
          player: gamePlayer,
        },
        expected: null,
        traceEnabled: true,
        traceCalls: [
          [`${logPrefix} args: "${JSON.stringify({ game: gameId })}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} does not have deck, nothing to resolve.`],
        ],
      })
    })
  })
})

async function testGameDeck({
  isAuthenticatedResponse,
  isGamePlayerResponse,
  gameId,
  expected,
  gameDeckResolverCalls = [],
  traceEnabled,
  errorCalls = [],
  warnCalls = [],
  traceCalls = [],
}: {
  isAuthenticatedResponse: UserDbObject | Error
  isGamePlayerResponse?: GameAndPlayer | Error
  gameId: string
  expected?: GameDeck | null
  gameDeckResolverCalls?: any[][]
  traceEnabled?: boolean
  errorCalls?: any[][]
  warnCalls?: any[][]
  traceCalls?: any[][]
}) {
  const context: Context = {
    session: {
      user: isAuthenticatedResponse instanceof Error ? undefined : isAuthenticatedResponse,
    },
  }
  const args: QueryGameDeckArgs = {
    game: gameId,
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
  const fromObjectSpy = jest.spyOn(GameDeckResolver, 'fromObject').mockResolvedValue(expected as any as GameDeck)
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GameDeckQuery['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  const promise = GameDeckQuery.gameDeck(args, context, null as any)
  const error =
    isAuthenticatedResponse instanceof Error
      ? isAuthenticatedResponse
      : isGamePlayerResponse instanceof Error
        ? isGamePlayerResponse
        : undefined
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(isAuthenticatedSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'gameDeck query',
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
              label: 'gameDeck query',
            },
          ],
        ]
  )
  expect(fromObjectSpy.mock.calls).toEqual(gameDeckResolverCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
