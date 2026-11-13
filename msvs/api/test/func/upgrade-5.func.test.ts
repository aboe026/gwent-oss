import allUpgrades from '../../src/database/upgrades/all-upgrades'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import GameStore from '../../src/database/stores/game-store'
import { verifyCollectionNames } from './util/expect-util'

describe('upgrade-5', () => {
  const upgradeNumber = 5
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
      names: [GameStore.COLLECTION_NAME],
      shouldExist: false,
    })

    await upgrader.run({
      upgrades: allUpgrades.slice(0, upgradeNumber),
    })

    await verifyCollectionNames({
      db,
      names: [GameStore.COLLECTION_NAME],
    })
    await expect(db.indexInformation(GameStore.COLLECTION_NAME)).resolves.toEqual({
      _id_: [['_id', 1]],
      ['players.user_1']: [['players.user', 1]],
    })
  })
})
