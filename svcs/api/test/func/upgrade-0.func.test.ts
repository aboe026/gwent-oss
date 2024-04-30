import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import UpgradeStore from '../../src/database/stores/upgrade-store'
import { verifyCollectionNames } from './util/expect-util'

describe('upgrade-0', () => {
  beforeEach(async () => {
    await DbUtil.deleteDatabase()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  it('creates collection and indexes', async () => {
    const db = await DbConnector.connect()
    await verifyCollectionNames({
      db,
      names: [],
    })

    jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([])
    await DbUpgrader.run()

    await verifyCollectionNames({
      db,
      names: [UpgradeStore.COLLECTION_NAME],
    })
    await expect(db.indexInformation(UpgradeStore.COLLECTION_NAME)).resolves.toEqual({
      _id_: [['_id', 1]],
    })
  })
})
