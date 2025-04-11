import { ObjectId } from 'mongodb'

import GameStore from '../../src/database/stores/game-store'
import RedrawImplementation from '../../src/graphql/resolvers/mutations/redraw/redraw-implementation'
import RedrawUnit from '../../src/graphql/resolvers/mutations/redraw/redraw-unit'
import TestUtil from '../util/test-util'

describe('redraw-implementation', () => {
  const logPrefix = 'log-prefix'
  it('throws error if updated game empty', async () => {
    const message = 'Could not redraw unit in probable race condition collision.'
    await testRedrawImplementation({
      logPrefix,
      updatedGameEmpty: true,
      error: Error(message),
      errorCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('returns objects if no errors', async () => {
    await testRedrawImplementation({
      logPrefix,
    })
  })
  it('logs to trace if enabled', async () => {
    await testRedrawImplementation({
      logPrefix,
      traceEnabled: true,
    })
  })
})

async function testRedrawImplementation({
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
  const unitId = new ObjectId().toString()
  const userId = new ObjectId()
  const from = TestUtil.getDbDeckUnit({})
  const to = TestUtil.getDbDeckUnit({})
  const game = TestUtil.getDbGame({})
  const updatedGame = {
    ...game,
    updated: new Date(game.updated.getTime() + 1),
  }
  const redrawUnitSpy = jest.spyOn(RedrawUnit, 'redrawUnit').mockReturnValue({
    from,
    to,
  })
  const gameStoreSaveSpy = jest.spyOn(GameStore, 'save').mockResolvedValue(updatedGameEmpty ? undefined : updatedGame)
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  RedrawImplementation['logger'] = {
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = RedrawImplementation.redrawImplementation({
    game,
    logPrefix,
    unitId,
    userId,
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual({
      from,
      game: updatedGame,
      to,
    })
  }

  expect(redrawUnitSpy.mock.calls).toEqual([
    [
      {
        game,
        logPrefix,
        unitId,
        userId,
      },
    ],
  ])
  expect(gameStoreSaveSpy.mock.calls).toEqual([[game]])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`]] : []
  )
}
