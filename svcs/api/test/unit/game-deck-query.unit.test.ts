import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { GameDeck, QueryGameDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import GameDeckQuery from '../../src/graphql/resolvers/queries/game-deck-query'
import GameDeckResolver from '../../src/graphql/resolvers/types/game-deck-resolver'
import GameStore from '../../src/database/stores/game-store'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import TestUtil from '../test-util'

describe('game-deck-query', () => {
  describe('gameDeck', () => {
    const userId = new ObjectId()
    const gameId = new ObjectId().toString()
    const logPrefix = `gameDeck by "${userId}"`
    it('returns error if no user on context', async () => {
      await testGameDeck({
        gameId,
        error: Error(NOT_AUTHENTICATED_MESSAGE),
        errorCalls: [[`No user on context for gameDeck query: "${JSON.stringify({})}".`]],
      })
    })
    it('returns error if game does not exist', async () => {
      const error = `Game with ID "${gameId}" does not exist.`
      await testGameDeck({
        userId,
        gameId,
        gameResponse: undefined,
        error: Error(error),
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if user is not a player', async () => {
      const error = `Not a player on game "${gameId}".`
      const game = TestUtil.getDbGame({
        id: gameId,
      })
      await testGameDeck({
        userId,
        gameId: gameId.toString(),
        gameResponse: game,
        error: Error(error),
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns undefined if player deck not set', async () => {
      await testGameDeck({
        userId: userId,
        gameId: gameId.toString(),
        gameResponse: TestUtil.getDbGame({
          id: gameId,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
            }),
          ],
        }),
        expected: null,
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
        userId: userId,
        gameId: gameId.toString(),
        gameResponse: TestUtil.getDbGame({
          id: gameId,
          creator: userId,
          players: [
            TestUtil.getDbGamePlayer({
              deck: playerDeck,
              user: userId,
            }),
          ],
        }),
        expected: gameDeck,
        gameDeckResolverCalls: [
          [
            {
              gameDeck: playerDeck,
              neutralDeckStats: undefined,
              neutralLeaderStats: undefined,
              neutralUnitStats: undefined,
            },
          ],
        ],
      })
    })
    it('logs to trace if enabled', async () => {
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
        userId: userId,
        gameId: gameId.toString(),
        gameResponse: TestUtil.getDbGame({
          id: gameId,
          creator: userId,
          players: [
            TestUtil.getDbGamePlayer({
              deck: playerDeck,
              user: userId,
            }),
          ],
        }),
        expected: gameDeck,
        gameDeckResolverCalls: [
          [
            {
              gameDeck: playerDeck,
              neutralDeckStats: undefined,
              neutralLeaderStats: undefined,
              neutralUnitStats: undefined,
            },
          ],
        ],
        logPrefix,
        traceEnabled: true,
      })
    })
  })
})

async function testGameDeck({
  userId,
  gameId,
  gameResponse,
  error,
  expected,
  gameDeckResolverCalls = [],
  logPrefix,
  traceEnabled,
  errorCalls = [],
  debugCalls = [],
}: {
  userId?: ObjectId
  gameId: string
  gameResponse?: GameDbObject
  error?: Error
  expected?: GameDeck | null
  gameDeckResolverCalls?: any[][]
  logPrefix?: string
  traceEnabled?: boolean
  errorCalls?: any[][]
  debugCalls?: any[][]
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
  const getByIdSpy = jest.spyOn(GameStore, 'getById').mockResolvedValue(gameResponse)
  const fromObjectSpy = jest.spyOn(GameDeckResolver, 'fromObject').mockResolvedValue(expected as any as GameDeck)
  const debugSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GameDeckQuery['logger'] = {
    debug: debugSpy,
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(GameDeckQuery.gameDeck(args, context, null as any)).resolves.toEqual(error || expected)

  expect(getByIdSpy.mock.calls).toEqual(
    userId
      ? [
          [
            {
              id: gameId,
            },
          ],
        ]
      : []
  )
  expect(fromObjectSpy.mock.calls).toEqual(gameDeckResolverCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} args: "${JSON.stringify({ game: gameId })}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} game: "${JSON.stringify(gameResponse)}"`],
          [
            `${logPrefix} player: "${JSON.stringify(
              gameResponse?.players.find((player) => player.user.toString() === userId?.toString())
            )}"`,
          ],
        ]
      : []
  )
}
