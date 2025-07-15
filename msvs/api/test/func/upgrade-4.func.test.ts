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
  it('creates collection and indexes', async () => {
    const upgrader = new DbUpgrader({})
    await upgrader.run({
      upgrades: allUpgrades.slice(0, upgradeNumber - 1),
    })

    const db = await DbConnector.connect()
    await verifyCollectionNames({
      db,
      names: [DeckStore.COLLECTION_NAME],
      shouldExist: false,
    })

    await upgrader.run({
      upgrades: allUpgrades.slice(0, upgradeNumber),
    })

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
