import { ObjectId } from 'mongodb'

import AddGameImplementation from '../../src/graphql/resolvers/mutations/add-game/add-game-implementation'
import GameStore from '../../src/database/stores/game-store'
import TestUtil from '../util/test-util'

describe('add-game-implementation', () => {
  it('returns game', async () => {
    await testAddGameImplementation({})
  })
  it('logs to trace if enabled', async () => {
    await testAddGameImplementation({
      traceEnabled: true,
    })
  })
})

async function testAddGameImplementation({ traceEnabled }: { traceEnabled?: boolean }) {
  const logPrefix = 'log-prefix'
  const userId = new ObjectId()
  const opponents = [TestUtil.getUser({})]
  const game = TestUtil.getDbGame({})
  const gameStoreAddSpy = jest.spyOn(GameStore, 'add').mockResolvedValue(game)
  const traceSpy = jest.fn().mockImplementation()
  AddGameImplementation['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(
    AddGameImplementation.AddGameImplementation({
      logPrefix,
      opponents,
      userId,
    })
  ).resolves.toEqual(game)

  expect(gameStoreAddSpy.mock.calls).toEqual([
    [
      {
        creatorId: userId,
        opponentIds: [opponents[0].id],
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`${logPrefix} game: "${JSON.stringify(game)}"`]] : [])
}
