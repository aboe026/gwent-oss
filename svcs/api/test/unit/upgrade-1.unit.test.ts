describe('upgrade-1', () => {
  it('calls to create card collection and indexes', async () => {
    const debugSpy = jest.fn().mockImplementation()
    jest.mock('log4js', () => ({
      getLogger: jest.fn().mockReturnValue({
        debug: debugSpy,
      }),
    }))
    const upgrade1 = require('../../src/database/upgrades/upgrade-1').default // eslint-disable-line @typescript-eslint/no-var-requires
    const DbConnector = require('../../src/database/db-connector').default // eslint-disable-line @typescript-eslint/no-var-requires
    const createCollectionSpy = jest.fn().mockImplementation()
    const createIndexSpy = jest.fn().mockImplementation()
    jest.spyOn(DbConnector, 'connect').mockReturnValue({
      createCollection: createCollectionSpy,
      createIndex: createIndexSpy,
    })
    const CardStore = require('../../src/database/card-store').default // eslint-disable-line @typescript-eslint/no-var-requires

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
