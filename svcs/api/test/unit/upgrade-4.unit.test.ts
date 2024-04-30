import DbConnector from '../../src/database/db-connector'
import DeckStore from '../../src/database/stores/deck-store'
import Upgrade4 from '../../src/database/upgrades/upgrade-4'

describe('upgrade-4', () => {
  it('calls to create deck collections and indexes', async () => {
    const debugSpy = jest.fn().mockImplementation()
    Upgrade4.logger = {
      debug: debugSpy,
    } as any
    const createCollectionSpy = jest.fn().mockImplementation()
    const createIndexSpy = jest.fn().mockImplementation()
    jest.spyOn(DbConnector, 'connect').mockResolvedValue({
      createCollection: createCollectionSpy,
      createIndex: createIndexSpy,
    } as any)

    await expect(new Upgrade4().run()).resolves.toEqual(undefined)

    expect(debugSpy.mock.calls).toEqual([
      ['Connecting to database'],
      [`Creating collection "${DeckStore.COLLECTION_NAME}"`],
      [`Creating index on collection "${DeckStore.COLLECTION_NAME}" for name:1,user:1 unique`],
    ])
    expect(createCollectionSpy.mock.calls).toEqual([[DeckStore.COLLECTION_NAME]])
    expect(createIndexSpy.mock.calls).toEqual([
      [
        DeckStore.COLLECTION_NAME,
        {
          user: 1,
          name: 1,
        },
        {
          unique: true,
        },
      ],
    ])
  })
})
