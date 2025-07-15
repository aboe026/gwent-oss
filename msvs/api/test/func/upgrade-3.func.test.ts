import allUpgrades from '../../src/database/upgrades/all-upgrades'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import UserStore from '../../src/database/stores/user-store'
import { verifyCollectionNames } from './util/expect-util'

describe('upgrade-3', () => {
  const upgradeNumber = 3
  beforeEach(async () => {
    await DbUtil.deleteDatabase()
  })
  it('creates collection and indexes', async () => {
    const upgrader = new DbUpgrader({})
    await upgrader.run({
      upgrades: allUpgrades.slice(0, upgradeNumber - 1),
    })

    const db = await DbConnector.connect()
    await verifyCollectionNames({
      db,
      names: [UserStore.COLLECTION_NAME],
      shouldExist: false,
    })

    await upgrader.run({
      upgrades: allUpgrades.slice(0, upgradeNumber),
    })

    await verifyCollectionNames({
      db,
      names: [UserStore.COLLECTION_NAME],
    })
    await expect(db.indexInformation(UserStore.COLLECTION_NAME)).resolves.toEqual({
      _id_: [['_id', 1]],
      name_1: [['name', 1]],
    })
  })
})
