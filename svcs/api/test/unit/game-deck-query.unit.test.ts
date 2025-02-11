import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { GameDeck, QueryGameDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import GameDeckQuery from '../../src/graphql/resolvers/queries/game-deck-query'
import GameDeckResolver from '../../src/graphql/resolvers/types/game-deck-resolver'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import ResolverUtil, { GamePlayerResponse } from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../test-util'

describe('game-deck-query', () => {
  describe('gameDeck', () => {
    const userId = new ObjectId()
    const gameId = new ObjectId().toString()
    const logPrefix = `gameDeck by "${userId}"`
    const gamePlayer = TestUtil.getDbGamePlayer({
      user: userId,
    })
    const game = TestUtil.getDbGame({
      id: gameId,
      creator: userId,
      players: [gamePlayer],
    })
    it('returns error if no user on context', async () => {
      await testGameDeck({
        gameId,
        error: Error(NOT_AUTHENTICATED_MESSAGE),
        errorCalls: [[`No user on context for gameDeck query: "${JSON.stringify({})}".`]],
      })
    })
    it('returns error if getGamePlayer returns error', async () => {
      const error = `Game ID "${gameId}" is not a valid MongoDB ObjectId.`
      await testGameDeck({
        userId,
        gameId: gameId.toString(),
        getGamePlayerResponse: Error(error),
        error: Error(error),
        logPrefix,
      })
    })
    it('returns undefined if player deck not set', async () => {
      await testGameDeck({
        userId,
        gameId: gameId.toString(),
        getGamePlayerResponse: {
          game,
          player: gamePlayer,
        },
        expected: null,
        logPrefix,
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
        userId,
        gameId: gameId.toString(),
        getGamePlayerResponse: {
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
        logPrefix,
        traceCalls: [[`${logPrefix} has deck "${deck._id}", resolving.`]],
      })
    })
    it('logs to trace if enabled', async () => {
      await testGameDeck({
        userId,
        gameId: gameId.toString(),
        getGamePlayerResponse: {
          game,
          player: gamePlayer,
        },
        expected: null,
        logPrefix,
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
  userId,
  gameId,
  getGamePlayerResponse,
  error,
  expected,
  gameDeckResolverCalls = [],
  logPrefix,
  traceEnabled,
  errorCalls = [],
  warnCalls = [],
  traceCalls = [],
}: {
  userId?: ObjectId
  gameId: string
  getGamePlayerResponse?: GamePlayerResponse | Error
  error?: Error
  expected?: GameDeck | null
  gameDeckResolverCalls?: any[][]
  logPrefix?: string
  traceEnabled?: boolean
  errorCalls?: any[][]
  warnCalls?: any[][]
  traceCalls?: any[][]
}) {
  const context: Context = {
    session: {},
  }
  if (userId && context.session) {
    context.session.user = TestUtil.getDbUser({
      id: userId,
    })
  }
  const args: QueryGameDeckArgs = {
    game: gameId,
  }
  const resolverUtil = new ResolverUtil({
    logger: GameDeckQuery['logger'],
  })
  const getGamePlayerSpy = jest.spyOn(resolverUtil, 'getGamePlayer')
  if (getGamePlayerResponse) {
    if (getGamePlayerResponse instanceof Error) {
      getGamePlayerSpy.mockRejectedValue(getGamePlayerResponse)
    } else {
      getGamePlayerSpy.mockResolvedValue(getGamePlayerResponse)
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

  await expect(GameDeckQuery.gameDeck(args, context, null as any)).resolves.toEqual(error || expected)

  expect(getGamePlayerSpy.mock.calls).toEqual(
    getGamePlayerResponse
      ? [
          [
            {
              gameId,
              logPrefix,
              userId,
            },
          ],
        ]
      : []
  )
  expect(fromObjectSpy.mock.calls).toEqual(gameDeckResolverCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
