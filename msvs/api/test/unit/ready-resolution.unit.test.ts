import { ObjectId } from 'mongodb'

import EventManager from '../../src/graphql/event-manager'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import { PubSubEvents } from '@gwent/constants'
import ReadyResolution from '../../src/graphql/resolvers/mutations/ready/ready-resolution'
import TestUtil from '../util/test-util'

describe('ready-resolution', () => {
  it('returns resolved game', async () => {
    await testReadyResolution({})
  })
  it('logs to trace if enabled', async () => {
    await testReadyResolution({
      traceEnabled: true,
    })
  })
})

async function testReadyResolution({ traceEnabled }: { traceEnabled?: boolean }) {
  const logPrefix = 'log-prefix'
  const userId = new ObjectId()
  const game = TestUtil.getDbGame({})
  const resolvedGame = TestUtil.getGameFromDbGame({
    game,
  })
  const maskedGame = TestUtil.getGame({})
  const gameResolverFromObjectSpy = jest.spyOn(GameResolver, 'fromObject').mockResolvedValue(resolvedGame)
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const maskSpiedHandUnitsSpy = jest.spyOn(GameResolver, 'maskSpiedHandUnits').mockReturnValue(maskedGame)
  const traceSpy = jest.fn().mockImplementation()
  ReadyResolution['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(
    ReadyResolution.readyResolution({
      game,
      logPrefix,
      userId,
    })
  ).resolves.toEqual(maskedGame)

  expect(gameResolverFromObjectSpy.mock.calls).toEqual([
    [
      {
        game,
      },
    ],
  ])
  expect(publishSpy.mock.calls).toEqual([
    [
      PubSubEvents.GameReady,
      {
        gameReady: resolvedGame,
      },
    ],
  ])
  expect(maskSpiedHandUnitsSpy.mock.calls).toEqual([
    [
      {
        game: resolvedGame,
        userId,
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`]] : []
  )
}
