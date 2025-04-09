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
  const game = TestUtil.getDbGame({})
  const resolvedGame = TestUtil.getGameFromDbGame({
    game,
  })
  const gameResolverFromObjectSpy = jest.spyOn(GameResolver, 'fromObject').mockResolvedValue(resolvedGame)
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  ReadyResolution['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(
    ReadyResolution.readyResolution({
      game,
      logPrefix,
    })
  ).resolves.toEqual(resolvedGame)

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
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`]] : []
  )
}
