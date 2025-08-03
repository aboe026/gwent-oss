import { ObjectId } from 'mongodb'

import AddGameResolution from '../../src/graphql/resolvers/mutations/add-game/add-game-resolution'
import EventManager from '../../src/graphql/event-manager'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import { PubSubEvents } from '@gwent/constants'
import TestUtil from '../util/test-util'
import UserResolver from '../../src/graphql/resolvers/types/user-resolver'

describe('add-game-resolution', () => {
  it('returns resolved game', async () => {
    await testAddGameResolution({})
  })
  it('logs to trace if enabled', async () => {
    await testAddGameResolution({
      traceEnabled: true,
    })
  })
})

async function testAddGameResolution({ traceEnabled }: { traceEnabled?: boolean }) {
  const logPrefix = 'log-prefix'
  const creator = TestUtil.getUser({})
  const game = TestUtil.getDbGame({
    creator: new ObjectId(creator.id),
  })
  const opponents = [TestUtil.getUser({})]
  const resolvedGame = TestUtil.getGameFromDbGame({
    game,
  })
  const gameResolverFromObjectSpy = jest.spyOn(GameResolver, 'fromObject').mockResolvedValue(resolvedGame)
  const userFromIdSpy = jest.spyOn(UserResolver, 'fromId').mockResolvedValue(creator)
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  AddGameResolution['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(
    AddGameResolution.addGameResolution({
      game,
      logPrefix,
      opponents,
      creatorId: new ObjectId(creator.id),
    })
  ).resolves.toEqual(resolvedGame)

  expect(gameResolverFromObjectSpy.mock.calls).toEqual([
    [
      {
        game,
        users: [...opponents, creator],
      },
    ],
  ])
  expect(userFromIdSpy.mock.calls).toEqual([[new ObjectId(creator.id)]])
  expect(publishSpy.mock.calls).toEqual([
    [
      PubSubEvents.GameAdded,
      {
        gameAdded: resolvedGame,
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`]] : []
  )
}
