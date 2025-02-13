import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import EventManager from '../../src/graphql/event-manager'
import { Game, MutationReadyArgs } from '@gwent/graphql-schema/resolver-typings'
import { GameDbObject, GamePlayerDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import MutationUtil from '../../src/graphql/resolvers/mutations/mutation-util'
import { PubSubEvents } from '@gwent/constants'
import ReadyMutation from '../../src/graphql/resolvers/mutations/ready-mutation'
import ResolverUtil, { GamePlayerResponse } from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../test-util'

describe('ready-mutation', () => {
  describe('ready', () => {
    const userId = new ObjectId()
    const gameId = new ObjectId().toString()
    const logPrefix = `ready by "${userId}"`
    const gamePlayerSelf = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({
        from: TestUtil.getDbDeck({}),
      }),
      user: userId,
    })
    const gamePlayerOpponent = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({
        from: TestUtil.getDbDeck({}),
      }),
    })
    const game = TestUtil.getDbGame({
      id: gameId,
      players: [gamePlayerSelf, gamePlayerOpponent],
    })
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
    const updatedGame: GameDbObject = {
      ...game,
      players: [
        {
          ...game.players[0],
          ready: true,
        },
        game.players[1],
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
        TestUtil.getGamePlayer({
          user: TestUtil.getUser({
            id: gamePlayerOpponent.user,
          }),
        }),
      ],
    })
    const setReadyCalls = [
      [
        {
          gameId,
          userId,
          players: [
            {
              ...gamePlayerSelf,
              ready: true,
            },
            gamePlayerOpponent,
          ],
          previousUpdate: game.updated,
          currentRound: 0,
        },
      ],
    ]
    it('throws error if deck not yet set', async () => {
      const error = `Must set deck on game "${gameId}" first.`
      await testReady({
        userId,
        gameId,
        getGamePlayerResponse: {
          game,
          player: {
            ...gamePlayerSelf,
            deck: {
              ...gamePlayerSelf.deck,
              from: undefined,
            },
          },
        },
        expected: Error(error),
        getGamePlayerCalls,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if already marked as ready', async () => {
      const error = `Game "${gameId}" already marked as ready.`
      await testReady({
        userId,
        gameId,
        getGamePlayerResponse: {
          game,
          player: {
            ...gamePlayerSelf,
            ready: true,
          },
        },
        expected: Error(error),
        getGamePlayerCalls,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if setReady response is undefined', async () => {
      const error = `Could not set player as ready for game "${gameId}" in probable race condition collision.`
      await testReady({
        userId,
        gameId,
        getGamePlayerResponse: {
          game,
          player: gamePlayerSelf,
        },
        setReadyResponse: undefined,
        expected: Error(error),
        getGamePlayerCalls,
        setReadyCalls,
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
        setReadyResponse: updatedGame,
        resolvedGame: resolvedGame,
        expected: resolvedGame,
        getGamePlayerCalls,
        setReadyCalls,
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
      const allPlayersReadyPlayers: GamePlayerDbObject[] = new MutationUtil({
        logger: getLogger('test'),
      }).initializeNewRound({
        players: [
          {
            ...game.players[0],
            ready: true,
          },
          readyOpponentGamePlayer,
        ],
      })
      const allPlayersReadyUpdatedGame: GameDbObject = {
        ...game,
        players: allPlayersReadyPlayers,
      }
      const allPlayersReadyResolvedGame: Game = {
        ...resolvedGame,
        round: 1,
        players: allPlayersReadyPlayers.map((dbGamePlayer) =>
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
        setReadyResponse: allPlayersReadyUpdatedGame,
        resolvedGame: allPlayersReadyResolvedGame,
        expected: allPlayersReadyResolvedGame,
        getGamePlayerCalls,
        setReadyCalls: [
          [
            {
              gameId,
              userId,
              players: allPlayersReadyPlayers,
              previousUpdate: game.updated,
              currentRound: 1,
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
        debugCalls: [[`${logPrefix} game "${gameId}" has all players ready, starting first round.`]],
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
        setReadyResponse: updatedGame,
        resolvedGame: resolvedGame,
        expected: resolvedGame,
        getGamePlayerCalls,
        setReadyCalls,
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
  setReadyResponse,
  resolvedGame,
  expected,
  getGamePlayerCalls = [],
  gameResolveCalls = [],
  setReadyCalls = [],
  logPrefix,
  unreadyPlayerIds = [],
  traceEnabled,
  warnCalls = [],
  errorCalls = [],
  debugCalls = [],
}: {
  userId?: ObjectId
  gameId?: string
  getGamePlayerResponse?: GamePlayerResponse | Error
  setReadyResponse?: GameDbObject
  resolvedGame?: Game
  expected?: Error | Game
  getGamePlayerCalls?: any[][]
  setReadyCalls?: any[][]
  gameResolveCalls?: any[][]
  logPrefix?: string
  unreadyPlayerIds?: string[]
  traceEnabled?: boolean
  warnCalls?: any[][]
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
  const args: MutationReadyArgs = {
    game: gameId,
  }
  const getGamePlayerSpy = jest.spyOn(ResolverUtil.prototype, 'getGamePlayer')
  if (getGamePlayerResponse) {
    if (getGamePlayerResponse instanceof Error) {
      getGamePlayerSpy.mockRejectedValue(getGamePlayerResponse)
    } else {
      getGamePlayerSpy.mockResolvedValue(getGamePlayerResponse)
    }
  }
  const setReadySpy = jest.spyOn(GameStore, 'save').mockResolvedValue(setReadyResponse)
  const gameResolveSpy = jest.spyOn(GameResolver, 'fromObject')
  if (resolvedGame) {
    gameResolveSpy.mockResolvedValue(resolvedGame)
  }
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  ReadyMutation['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    debug: debugSpy,
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
  expect(debugSpy.mock.calls).toEqual(debugCalls)
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
          [`${logPrefix} game "${gameId}" unreadyPlayers: "${JSON.stringify(unreadyPlayerIds)}"`],
          [`${logPrefix} game "${gameId}" currentRound: "${setReadyResponse?.round}"`],
          [`${logPrefix} updatedGame: "${JSON.stringify(setReadyResponse)}"`],
        ]
      : []
  )
}
