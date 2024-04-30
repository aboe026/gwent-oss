import allUpgrades from '../../src/database/upgrades/all-upgrades'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import DeckStore from '../../src/database/stores/deck-store'
import { verifyCollectionNames } from './util/expect-util'

describe('upgrade-4', () => {
  const upgradeNumber = 4
  beforeEach(async () => {
    await DbUtil.deleteDatabase()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  it('creates collection and indexes', async () => {
    jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue(allUpgrades.slice(0, upgradeNumber - 1))
    await DbUpgrader.run()

    const db = await DbConnector.connect()
    await verifyCollectionNames({
      db,
      names: [DeckStore.COLLECTION_NAME],
      shouldExist: false,
    })

    jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue(allUpgrades.slice(0, upgradeNumber))

    await DbUpgrader.run()

    await verifyCollectionNames({
      db,
      names: [DeckStore.COLLECTION_NAME],
    })
    await expect(db.indexInformation(DeckStore.COLLECTION_NAME)).resolves.toEqual({
      _id_: [['_id', 1]],
      user_1_name_1: [
        ['user', 1],
        ['name', 1],
      ],
    })
  })
})
