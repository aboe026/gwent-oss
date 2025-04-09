import { ObjectId } from 'mongodb'

import GameStore from '../../src/database/stores/game-store'
import MarkPlayerReady from '../../src/graphql/resolvers/mutations/ready/mark-player-ready'
import ReadyImplementation from '../../src/graphql/resolvers/mutations/ready/ready-implementation'
import TestUtil from '../util/test-util'

describe('ready-implementation', () => {
  const logPrefix = 'log-prefix'
  it('throws error if updated game empty', async () => {
    const message = 'Could not set player as ready in probable race condition collision.'
    await testReadyImplementation({
      logPrefix,
      updatedGameEmpty: true,
      error: Error(message),
      errorCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('returns updated game if no errors', async () => {
    await testReadyImplementation({
      logPrefix,
    })
  })
  it('logs to trace if enabled', async () => {
    await testReadyImplementation({
      logPrefix,
      traceEnabled: true,
    })
  })
})

async function testReadyImplementation({
  logPrefix,
  updatedGameEmpty,
  error,
  errorCalls = [],
  traceEnabled,
}: {
  logPrefix: string
  updatedGameEmpty?: boolean
  error?: Error
  errorCalls?: string[][]
  traceEnabled?: boolean
}) {
  const userId = new ObjectId()
  const game = TestUtil.getDbGame({})
  const updatedGame = {
    ...game,
    updated: new Date(),
  }
  const markPlayerReadySpy = jest.spyOn(MarkPlayerReady, 'markPlayerReady').mockImplementation()
  const gameStoreSaveSpy = jest.spyOn(GameStore, 'save').mockResolvedValue(updatedGameEmpty ? undefined : updatedGame)
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  ReadyImplementation['logger'] = {
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = ReadyImplementation.readyImplementation({
    game,
    logPrefix,
    userId,
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(updatedGame)
  }

  expect(markPlayerReadySpy.mock.calls).toEqual([
    [
      {
        game,
        userId,
        logPrefix,
      },
    ],
  ])
  expect(gameStoreSaveSpy.mock.calls).toEqual([[game]])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`]] : []
  )
}
