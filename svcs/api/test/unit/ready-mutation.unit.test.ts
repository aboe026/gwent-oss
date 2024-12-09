import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import EventManager from '../../src/graphql/event-manager'
import { Game, MutationReadyArgs } from '@gwent/graphql-schema/resolver-typings'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import { NOT_AUTHENTICATED_MESSAGE, PubSubEvents } from '@gwent/constants'
import ReadyMutation from '../../src/graphql/resolvers/mutations/ready-mutation'
import TestUtil from '../test-util'

describe('ready-mutation', () => {
  describe('ready', () => {
    const userId = new ObjectId()
    const gameId = new ObjectId().toString()
    const logPrefix = `ready by "${userId}"`
    it('returns error if game does not exist', async () => {
      await testReady({
        gameId,
        expected: Error(NOT_AUTHENTICATED_MESSAGE),
        errorCalls: [[`No user on context for ready mutation: "${JSON.stringify({})}".`]],
      })
    })
    it('returns error if invalid game ID', async () => {
      const invalidId = 'invalid'
      const error = `Game ID "${invalidId}" is not a valid MongoDB ObjectId.`
      await testReady({
        userId,
        gameId: invalidId,
        expected: Error(error),
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if game does not exist', async () => {
      const error = `Game with ID "${gameId}" does not exist.`
      await testReady({
        userId,
        gameId,
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if not a player on the game', async () => {
      const error = `Not a player on game "${gameId}".`
      await testReady({
        userId,
        gameId,
        gameGetResponse: TestUtil.getDbGame({
          id: gameId,
        }),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if deck not yet set', async () => {
      const error = `Must set deck on game "${gameId}" first.`
      await testReady({
        userId,
        gameId,
        gameGetResponse: TestUtil.getDbGame({
          id: gameId,
          creator: userId,
        }),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if already marked as ready', async () => {
      const error = `Game "${gameId}" already marked as ready.`
      await testReady({
        userId,
        gameId,
        gameGetResponse: TestUtil.getDbGame({
          id: gameId,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
              ready: true,
              user: userId,
            }),
          ],
        }),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if setReady response is undefined', async () => {
      const error = `Could not set player as ready for game "${gameId}" in probable race condition collision.`
      await testReady({
        userId,
        gameId,
        gameGetResponse: TestUtil.getDbGame({
          id: gameId,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
              user: userId,
            }),
          ],
        }),
        setReadyResponse: undefined,
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        setReadyCalls: [
          [
            {
              gameId,
              userId,
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns resolved game if no errors', async () => {
      const game = TestUtil.getDbGame({
        id: gameId,
        players: [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({}),
            }),
            user: userId,
          }),
        ],
      })
      const updatedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...game.players[0],
            ready: true,
          },
        ],
      }
      const resolvedGame = TestUtil.getGame({
        id: game._id,
        players: [
          TestUtil.getGamePlayer({
            ready: true,
            user: TestUtil.getUser({
              id: userId,
            }),
          }),
        ],
      })
      await testReady({
        userId,
        gameId,
        gameGetResponse: game,
        setReadyResponse: updatedGame,
        resolvedGame: resolvedGame,
        expected: resolvedGame,
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        setReadyCalls: [
          [
            {
              gameId,
              userId,
            },
          ],
        ],
        gameResolveCalls: [
          [
            {
              game: updatedGame,
            },
          ],
        ],
      })
    })
    it('logs to trace if enabled', async () => {
      const game = TestUtil.getDbGame({
        id: gameId,
        players: [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({}),
            }),
            user: userId,
          }),
        ],
      })
      const updatedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...game.players[0],
            ready: true,
          },
        ],
      }
      const resolvedGame = TestUtil.getGame({
        id: game._id,
        players: [
          TestUtil.getGamePlayer({
            ready: true,
            user: TestUtil.getUser({
              id: userId,
            }),
          }),
        ],
      })
      await testReady({
        userId,
        gameId,
        gameGetResponse: game,
        setReadyResponse: updatedGame,
        resolvedGame: resolvedGame,
        expected: resolvedGame,
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        setReadyCalls: [
          [
            {
              gameId,
              userId,
            },
          ],
        ],
        gameResolveCalls: [
          [
            {
              game: updatedGame,
            },
          ],
        ],
        logPrefix,
        traceEnabled: true,
      })
    })
  })
})

async function testReady({
  userId,
  gameId = new ObjectId().toString(),
  gameGetResponse,
  setReadyResponse,
  resolvedGame,
  expected,
  gameGetCalls = [],
  gameResolveCalls = [],
  setReadyCalls = [],
  logPrefix,
  traceEnabled,
  warnCalls = [],
  errorCalls = [],
}: {
  userId?: ObjectId
  gameId?: string
  gameGetResponse?: GameDbObject
  setReadyResponse?: GameDbObject
  resolvedGame?: Game
  expected?: Error | Game
  gameGetCalls?: any[][]
  setReadyCalls?: any[][]
  gameResolveCalls?: any[][]
  logPrefix?: string
  traceEnabled?: boolean
  warnCalls?: any[][]
  errorCalls?: any[][]
}) {
  const context: Context = {
    session: {},
  }
  if (userId && context.session) {
    context.session.user = TestUtil.getDbUser({
      id: userId,
    })
  }
  const args: MutationReadyArgs = {
    game: gameId,
  }
  const gameGetSpy = jest.spyOn(GameStore, 'getById').mockResolvedValue(gameGetResponse)
  const setReadySpy = jest.spyOn(GameStore, 'setReady').mockResolvedValue(setReadyResponse)
  const gameResolveSpy = jest.spyOn(GameResolver, 'fromObject')
  if (resolvedGame) {
    gameResolveSpy.mockResolvedValue(resolvedGame)
  }
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  ReadyMutation['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(ReadyMutation.ready(args, context, null as any)).resolves.toEqual(expected)

  expect(gameGetSpy.mock.calls).toEqual(gameGetCalls)
  expect(setReadySpy.mock.calls).toEqual(setReadyCalls)
  expect(gameResolveSpy.mock.calls).toEqual(gameResolveCalls)
  expect(publishSpy.mock.calls).toEqual(
    expected instanceof Error
      ? []
      : [
          [
            PubSubEvents.GameReady,
            {
              gameReady: resolvedGame,
            },
          ],
        ]
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `${logPrefix} args: "${JSON.stringify({
              game: gameId,
            })}"`,
          ],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} game: "${JSON.stringify(gameGetResponse)}"`],
          [
            `${logPrefix} player: "${JSON.stringify(
              gameGetResponse?.players.find((player) => player.user.toString() === (userId || '').toString())
            )}"`,
          ],
          [`${logPrefix} updatedGame: "${JSON.stringify(setReadyResponse)}"`],
        ]
      : []
  )
}
