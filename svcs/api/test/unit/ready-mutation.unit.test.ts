import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import EventManager from '../../src/graphql/event-manager'
import { Game, MutationReadyArgs } from '@gwent/graphql-schema/resolver-typings'
import { GameDbObject, GamePlayerDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import initializeNewRound from '../../src/graphql/resolvers/mutations/util/initialize-new-round'
import { PubSubEvents } from '@gwent/constants'
import ReadyMutation from '../../src/graphql/resolvers/mutations/ready-mutation'
import ResolverUtil, { GamePlayerResponse } from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('ready-mutation', () => {
  const userId = new ObjectId()
  const gameId = new ObjectId().toString()
  const logPrefix = `ready by "${userId}" on game "${gameId}"`
  const getGamePlayerCalls = [
    [
      {
        gameId,
        userId,
        status: GameStatus.Redrawing,
        label: 'mark ready',
      },
    ],
  ]
  let gamePlayerSelf: GamePlayerDbObject
  let gamePlayerOpponent: GamePlayerDbObject
  let game: GameDbObject
  let updatedGame: GameDbObject
  let resolvedGame: Game
  describe('ready', () => {
    beforeEach(() => {
      gamePlayerSelf = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        user: userId,
      })
      gamePlayerOpponent = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
      })
      game = TestUtil.getDbGame({
        id: gameId,
        players: [gamePlayerSelf, gamePlayerOpponent],
      })
      updatedGame = {
        ...game,
        players: [
          {
            ...game.players[0],
            ready: true,
          },
          game.players[1],
        ],
        updated: new Date(),
      }
      resolvedGame = TestUtil.getGame({
        id: game._id,
        players: [
          TestUtil.getGamePlayer({
            ready: true,
            user: TestUtil.getUser({
              id: userId,
            }),
          }),
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: gamePlayerOpponent.user,
            }),
          }),
        ],
      })
    })
    it('throws error if save response is undefined', async () => {
      const error = 'Could not set player as ready in probable race condition collision.'
      await testReady({
        userId,
        gameId,
        getGamePlayerResponse: {
          game,
          player: gamePlayerSelf,
        },
        saveResponse: undefined,
        expected: Error(error),
        getGamePlayerCalls,
        saveCalls: [
          [
            {
              ...updatedGame,
              updated: game.updated,
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns resolved game if no errors', async () => {
      await testReady({
        userId,
        gameId,
        getGamePlayerResponse: {
          game,
          player: gamePlayerSelf,
        },
        saveResponse: updatedGame,
        resolvedGame: resolvedGame,
        expected: resolvedGame,
        getGamePlayerCalls,
        saveCalls: [
          [
            {
              ...updatedGame,
              updated: game.updated,
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
    it('initiates first round if all players ready', async () => {
      const readyOpponentGamePlayer: GamePlayerDbObject = {
        ...gamePlayerOpponent,
        ready: true,
      }
      const allPlayersReadyGame: GameDbObject = {
        ...game,
        players: [gamePlayerSelf, readyOpponentGamePlayer],
      }
      const allPlayersReadyUpdatedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...game.players[0],
            ready: true,
          },
          readyOpponentGamePlayer,
        ],
        round: 0,
        status: GameStatus.Playing,
      }
      initializeNewRound({
        game: allPlayersReadyUpdatedGame,
      })
      const allPlayersReadyResolvedGame: Game = {
        ...resolvedGame,
        round: 1,
        players: allPlayersReadyUpdatedGame.players.map((dbGamePlayer) =>
          TestUtil.getGamePlayer({
            ready: true,
            user: TestUtil.getUser({
              id: dbGamePlayer.user,
            }),
          })
        ),
      }
      await testReady({
        userId,
        gameId,
        getGamePlayerResponse: {
          game: allPlayersReadyGame,
          player: gamePlayerSelf,
        },
        saveResponse: allPlayersReadyUpdatedGame,
        resolvedGame: allPlayersReadyResolvedGame,
        expected: allPlayersReadyResolvedGame,
        getGamePlayerCalls,
        saveCalls: [
          [
            {
              ...allPlayersReadyUpdatedGame,
              updated: game.updated,
            },
          ],
        ],
        gameResolveCalls: [
          [
            {
              game: allPlayersReadyUpdatedGame,
            },
          ],
        ],
      })
    })
    it('logs to trace if enabled', async () => {
      await testReady({
        userId,
        gameId,
        getGamePlayerResponse: {
          game,
          player: gamePlayerSelf,
        },
        saveResponse: updatedGame,
        resolvedGame: resolvedGame,
        expected: resolvedGame,
        getGamePlayerCalls,
        saveCalls: [
          [
            {
              ...updatedGame,
              updated: game.updated,
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
        unreadyPlayerIds: [gamePlayerOpponent.user.toString()],
        traceEnabled: true,
      })
    })
  })
})

async function testReady({
  userId,
  gameId = new ObjectId().toString(),
  getGamePlayerResponse,
  saveResponse,
  resolvedGame,
  expected,
  getGamePlayerCalls = [],
  gameResolveCalls = [],
  saveCalls = [],
  logPrefix,
  traceEnabled,
  warnCalls = [],
  errorCalls = [],
}: {
  userId?: ObjectId
  gameId?: string
  getGamePlayerResponse?: GamePlayerResponse
  saveResponse?: GameDbObject
  resolvedGame?: Game
  expected?: Error | Game
  getGamePlayerCalls?: any[][]
  saveCalls?: any[][]
  gameResolveCalls?: any[][]
  logPrefix?: string
  unreadyPlayerIds?: string[]
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
  const getGamePlayerSpy = jest.spyOn(ResolverUtil.prototype, 'getGamePlayer')
  if (getGamePlayerResponse) {
    getGamePlayerSpy.mockResolvedValue(getGamePlayerResponse)
  }
  const saveSpy = jest.spyOn(GameStore, 'save').mockResolvedValue(saveResponse)
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

  const promise = ReadyMutation.ready(args, context, null as any)
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(getGamePlayerSpy.mock.calls).toEqual(getGamePlayerCalls)
  expect(saveSpy.mock.calls).toEqual(saveCalls)
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
          [`${logPrefix} updatedGame: "${JSON.stringify(saveResponse)}"`],
        ]
      : []
  )
}
