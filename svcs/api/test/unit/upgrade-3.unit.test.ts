import log4js from 'log4js'

import DbConnector from '../../src/database/db-connector'
import upgrade3 from '../../src/database/upgrades/upgrade-3'
import UserStore from '../../src/database/user-store'

describe('upgrade-3', () => {
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

    await expect(upgrade3()).resolves.toEqual(undefined)

    expect(debugSpy.mock.calls).toEqual([
      ['Connecting to database'],
      [`Creating collection "${UserStore.COLLECTION_NAME}"`],
      [`Creating index on collection "${UserStore.COLLECTION_NAME}" for name:1 unique`],
    ])
    expect(createCollectionSpy.mock.calls).toEqual([[UserStore.COLLECTION_NAME]])
    expect(createIndexSpy.mock.calls).toEqual([
      [
        UserStore.COLLECTION_NAME,
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
