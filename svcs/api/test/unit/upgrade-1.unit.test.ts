import log4js from 'log4js'

import CardStore from '../../src/database/card-store'
import DbConnector from '../../src/database/db-connector'
import upgrade1 from '../../src/database/upgrades/upgrade-1'

describe('upgrade-1', () => {
  it('calls to create card collection and indexes', async () => {
    const debugSpy = jest.fn().mockImplementation()
    jest.spyOn(log4js, 'getLogger').mockReturnValue({
      debug: debugSpy,
    } as any)
    const createCollectionSpy = jest.fn().mockImplementation()
    const createIndexSpy = jest.fn().mockImplementation()
    jest.spyOn(DbConnector, 'connect').mockResolvedValue({
      createCollection: createCollectionSpy,
      createIndex: createIndexSpy,
    } as any)

    await expect(upgrade1()).resolves.toEqual(undefined)

    expect(debugSpy.mock.calls).toEqual([
      ['Connecting to database'],
      [`Creating collection "${CardStore.COLLECTION_NAME}"`],
      [`Creating index on collection "${CardStore.COLLECTION_NAME}" for type:1`],
      [`Creating index on collection "${CardStore.COLLECTION_NAME}" for name:1 unique`],
    ])
    expect(createCollectionSpy.mock.calls).toEqual([[CardStore.COLLECTION_NAME]])
    expect(createIndexSpy.mock.calls).toEqual([
      [
        CardStore.COLLECTION_NAME,
        {
          type: 1,
        },
      ],
      [
        CardStore.COLLECTION_NAME,
        {
          name: 1,
        },
        {
          unique: true,
        },
      ],
    ])
  })
})
