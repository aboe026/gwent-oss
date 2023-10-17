import CardStore from '../../src/database/card-store'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import upgrade1 from '../../src/database/upgrades/upgrade-1'
import UpgradeStore from '../../src/database/upgrade-store'

describe('upgrade-1', () => {
  beforeEach(async () => {
    await DbUtil.deleteDatabase()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  it('creates collection and indexes', async () => {
    const db = await DbConnector.connect()
    await expect(db.listCollections().toArray()).resolves.toEqual([])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([upgrade1])

    await DbUpgrader.run()

    const collections = await db.listCollections().toArray()
    expect(collections?.map((collection) => collection.name)).toEqual(
      expect.arrayContaining([CardStore.COLLECTION_NAME, UpgradeStore.COLLECTION_NAME])
    )
    await expect(db.indexInformation(UpgradeStore.COLLECTION_NAME)).resolves.toEqual({
      _id_: [['_id', 1]],
    })
    await expect(db.indexInformation(CardStore.COLLECTION_NAME)).resolves.toEqual({
      _id_: [['_id', 1]],
      type_1: [['type', 1]],
      name_1: [['name', 1]],
    })
  })
})
