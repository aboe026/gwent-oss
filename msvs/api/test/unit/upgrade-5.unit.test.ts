import DbConnector from '../../src/database/db-connector'
import GameStore from '../../src/database/stores/game-store'
import Upgrade5 from '../../src/database/upgrades/upgrade-5'

describe('upgrade-5', () => {
  it('calls to create game collections and indexes', async () => {
    const debugSpy = jest.fn().mockImplementation()
    Upgrade5.logger = {
      debug: debugSpy,
    } as any
    const createCollectionSpy = jest.fn().mockImplementation()
    const createIndexSpy = jest.fn().mockImplementation()
    jest.spyOn(DbConnector, 'connect').mockResolvedValue({
      createCollection: createCollectionSpy,
      createIndex: createIndexSpy,
    } as any)

    await expect(new Upgrade5().run()).resolves.toEqual(undefined)

    expect(debugSpy.mock.calls).toEqual([
      ['Connecting to database'],
      [`Creating collection "${GameStore.COLLECTION_NAME}"`],
      [`Creating index on collection "${GameStore.COLLECTION_NAME}" for players.user:1`],
    ])
    expect(createCollectionSpy.mock.calls).toEqual([[GameStore.COLLECTION_NAME]])
    expect(createIndexSpy.mock.calls).toEqual([
      [
        GameStore.COLLECTION_NAME,
        {
          'players.user': 1,
        },
      ],
    ])
  })
})
