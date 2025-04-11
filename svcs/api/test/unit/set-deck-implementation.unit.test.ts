import { ObjectId } from 'mongodb'

import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../src/database/stores/game-store'
import SetDeckImplementation from '../../src/graphql/resolvers/mutations/set-deck/set-deck-implementation'
import SetGameDeck from '../../src/graphql/resolvers/mutations/set-deck/set-game-deck'
import TestUtil from '../util/test-util'

describe('set-deck-implementation', () => {
  const userId = new ObjectId()
  const logPrefix = 'log-prefix'
  it('throws error if updated game empty', async () => {
    const message = 'Could not set deck in probable race condition collision.'
    await testSetDeckImplementation({
      userId,
      updatedGame: undefined,
      logPrefix,
      error: Error(message),
      errorCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if player not on updated game', async () => {
    const message = 'Could not get player after setting deck.'
    await testSetDeckImplementation({
      userId,
      updatedGame: TestUtil.getDbGame({}),
      logPrefix,
      error: Error(message),
      errorCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('returns object if no errors and first player', async () => {
    await testSetDeckImplementation({
      userId,
      updatedGame: TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
          TestUtil.getDbGamePlayer({}),
        ],
      }),
      logPrefix,
    })
  })
  it('returns object if no errors and second player', async () => {
    await testSetDeckImplementation({
      userId,
      updatedGame: TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({}),
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
        ],
      }),
      logPrefix,
    })
  })
  it('logs to trace if enabled', async () => {
    await testSetDeckImplementation({
      userId,
      updatedGame: TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
          TestUtil.getDbGamePlayer({}),
        ],
      }),
      logPrefix,
      traceEnabled: true,
    })
  })
})

async function testSetDeckImplementation({
  userId,
  updatedGame,
  logPrefix = 'log-prefix',
  error,
  errorCalls = [],
  traceEnabled,
}: {
  userId: ObjectId
  updatedGame: GameDbObject | undefined
  logPrefix?: string
  error?: Error
  errorCalls?: string[][]
  traceEnabled?: boolean
}) {
  const game = TestUtil.getDbGame({})
  const deck = TestUtil.getDbDeck({})
  const setGameDeckSpy = jest.spyOn(SetGameDeck, 'setGameDeck').mockImplementation()
  const gameStoreSaveSpy = jest.spyOn(GameStore, 'save').mockResolvedValue(updatedGame)
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SetDeckImplementation['logger'] = {
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = SetDeckImplementation.setDeckImplementation({
    deck,
    game,
    logPrefix,
    userId,
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual({
      game: updatedGame,
      gameDeck: updatedGame?.players[0].deck,
    })
  }

  expect(setGameDeckSpy.mock.calls).toEqual([
    [
      {
        game,
        deck,
        userId,
        logPrefix,
      },
    ],
  ])
  expect(gameStoreSaveSpy.mock.calls).toEqual([[game]])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`],
          [`${logPrefix} updatedPlayer: "${JSON.stringify(updatedGame?.players[0])}"`],
        ]
      : []
  )
}
