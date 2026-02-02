import { ObjectId } from 'mongodb'

import { GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import MarkPlayerReady from '../../src/graphql/resolvers/mutations/ready/mark-player-ready'
import deepClone from '../util/deep-clone'
import TestUtil from '../util/test-util'

describe('mark-player-ready', () => {
  const logPrefix = 'test-log-prefix'
  it('throws error if player not in game', () => {
    const userId = new ObjectId()
    const game = TestUtil.getDbGame({
      players: [TestUtil.getDbGamePlayer({}), TestUtil.getDbGamePlayer({})],
      status: GameStatus.Redrawing,
    })
    const message = `Could not find player "${userId}" on game "${game._id}" to mark as ready.`
    testMarkPlayerReady({
      game,
      logPrefix,
      userId,
      error: Error(message),
      errorCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  describe('first player', () => {
    it('throws error if already marked as ready', () => {
      const userId = new ObjectId()
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
            ready: true,
          }),
          TestUtil.getDbGamePlayer({}),
        ],
        status: GameStatus.Redrawing,
      })
      const message = 'Already marked as ready.'
      testMarkPlayerReady({
        game,
        logPrefix,
        userId,
        expectedReadyUserIds: [userId.toString()],
        error: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('sets ready to true if no player marked as ready', () => {
      const userId = new ObjectId()
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
          TestUtil.getDbGamePlayer({}),
        ],
        status: GameStatus.Redrawing,
      })
      testMarkPlayerReady({
        game,
        logPrefix,
        userId,
        expectedReadyUserIds: [userId.toString()],
      })
    })
    it('sets ready to true if only opponent marked as ready', () => {
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
          TestUtil.getDbGamePlayer({
            user: opponentId,
            ready: true,
          }),
        ],
        status: GameStatus.Redrawing,
      })
      testMarkPlayerReady({
        game,
        logPrefix,
        userId,
        expectedReadyUserIds: [userId.toString(), opponentId.toString()],
        expectedStatus: GameStatus.Playing,
        debugCalls: [[`${logPrefix} has all players ready, starting first round.`]],
      })
    })
    it('logs to trace if enabled', () => {
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
          TestUtil.getDbGamePlayer({
            user: opponentId,
          }),
        ],
        status: GameStatus.Redrawing,
      })
      testMarkPlayerReady({
        game,
        logPrefix,
        userId,
        expectedReadyUserIds: [userId.toString()],
        traceEnabled: true,
        traceCalls: [[`${logPrefix} unreadyPlayers: "["${opponentId}"]"`]],
      })
    })
  })
  describe('second player', () => {
    it('throws error if already marked as ready', () => {
      const userId = new ObjectId()
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({}),
          TestUtil.getDbGamePlayer({
            user: userId,
            ready: true,
          }),
        ],
        status: GameStatus.Redrawing,
      })
      const message = 'Already marked as ready.'
      testMarkPlayerReady({
        game,
        logPrefix,
        userId,
        expectedReadyUserIds: [userId.toString()],
        error: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('sets ready to true if no player marked as ready', () => {
      const userId = new ObjectId()
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({}),
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
        ],
        status: GameStatus.Redrawing,
      })
      testMarkPlayerReady({
        game,
        logPrefix,
        userId,
        expectedReadyUserIds: [userId.toString()],
      })
    })
    it('sets ready to true if only opponent marked as ready', () => {
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            user: opponentId,
            ready: true,
          }),
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
        ],
        status: GameStatus.Redrawing,
      })
      testMarkPlayerReady({
        game,
        logPrefix,
        userId,
        expectedReadyUserIds: [opponentId.toString(), userId.toString()],
        expectedStatus: GameStatus.Playing,
        debugCalls: [[`${logPrefix} has all players ready, starting first round.`]],
      })
    })
    it('logs to trace if enabled', () => {
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            user: opponentId,
          }),
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
        ],
        status: GameStatus.Redrawing,
      })
      testMarkPlayerReady({
        game,
        logPrefix,
        userId,
        expectedReadyUserIds: [userId.toString()],
        traceEnabled: true,
        traceCalls: [[`${logPrefix} unreadyPlayers: "["${opponentId}"]"`]],
      })
    })
  })
})

function testMarkPlayerReady({
  game,
  logPrefix,
  userId,
  expectedReadyUserIds = [],
  expectedStatus = GameStatus.Redrawing,
  error,
  errorCalls = [],
  warnCalls = [],
  debugCalls = [],
  traceCalls = [],
  traceEnabled,
}: {
  game: GameDbObject
  logPrefix: string
  userId: ObjectId
  expectedReadyUserIds?: string[]
  expectedStatus?: GameStatus
  error?: Error
  errorCalls?: string[][]
  warnCalls?: string[][]
  debugCalls?: string[][]
  traceCalls?: string[][]
  traceEnabled?: boolean
}) {
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  MarkPlayerReady['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any
  const origGame = deepClone(game)

  if (error) {
    expect(() =>
      MarkPlayerReady.markPlayerReady({
        game,
        logPrefix,
        userId,
      })
    ).toThrow(error)
  } else {
    expect(
      MarkPlayerReady.markPlayerReady({
        game,
        logPrefix,
        userId,
      })
    ).toEqual(undefined)
  }

  expect(game).toEqual({
    ...origGame,
    players: origGame.players.map((player) => {
      return {
        ...player,
        ready: expectedReadyUserIds.includes(player.user.toString()) ? true : false,
        rounds:
          expectedStatus === GameStatus.Playing
            ? [
                ...player.rounds,
                {
                  close: {
                    score: 0,
                    units: [],
                  },
                  moves: [],
                  passed: false,
                  ranged: {
                    score: 0,
                    units: [],
                  },
                  score: 0,
                  siege: {
                    score: 0,
                    units: [],
                  },
                  weathers: [],
                },
              ]
            : player.rounds,
      }
    }),
    round: expectedStatus === GameStatus.Playing ? origGame.round + 1 : origGame.round,
    status: expectedStatus,
  })
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
