import { ObjectId } from 'mongodb'

import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import MarkPlayerReady from '../../src/graphql/resolvers/mutations/util/mark-player-ready'
import deepClone from '../util/deep-clone'
import TestUtil from '../util/test-util'

describe('mark-player-ready', () => {
  const logPrefix = 'test-log-prefix'
  it('throws error if player not in game', () => {
    const userId = new ObjectId()
    const game = TestUtil.getDbGame({
      players: [TestUtil.getDbGamePlayer({}), TestUtil.getDbGamePlayer({})],
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
      })
      testMarkPlayerReady({
        game,
        logPrefix,
        userId,
        expectedReadyUserIds: [userId.toString(), opponentId.toString()],
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
      })
      testMarkPlayerReady({
        game,
        logPrefix,
        userId,
        expectedReadyUserIds: [opponentId.toString(), userId.toString()],
      })
    })
  })
})

function testMarkPlayerReady({
  game,
  logPrefix,
  userId,
  expectedReadyUserIds = [],
  error,
  errorCalls = [],
  warnCalls = [],
}: {
  game: GameDbObject
  logPrefix: string
  userId: ObjectId
  expectedReadyUserIds?: string[]
  error?: Error
  errorCalls?: string[][]
  warnCalls?: string[][]
}) {
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  MarkPlayerReady['logger'] = {
    error: errorSpy,
    warn: warnSpy,
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
      }
    }),
  })
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
}
