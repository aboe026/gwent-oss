import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import upgrade3 from '../../src/database/upgrades/upgrade-3'
import UpgradeStore from '../../src/database/upgrade-store'
import UserStore from '../../src/database/user-store'

describe('upgrade-3', () => {
  beforeEach(async () => {
    await DbUtil.deleteDatabase()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  it('creates collection and indexes', async () => {
    const db = await DbConnector.connect()
    await expect(db.listCollections().toArray()).resolves.toEqual([])

    jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([upgrade3])

    await DbUpgrader.run()

    const collections = await db.listCollections().toArray()
    expect(collections?.map((collection) => collection.name)).toEqual(
      expect.arrayContaining([UserStore.COLLECTION_NAME, UpgradeStore.COLLECTION_NAME])
    )
    await expect(db.indexInformation(UpgradeStore.COLLECTION_NAME)).resolves.toEqual({
      _id_: [['_id', 1]],
    })
    await expect(db.indexInformation(UserStore.COLLECTION_NAME)).resolves.toEqual({
      _id_: [['_id', 1]],
      name_1: [['name', 1]],
    })
  })
})
