import allUpgrades from '../../src/database/upgrades/all-upgrades'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import DlcStore from '../../src/database/stores/dlc-store'
import EffectStore from '../../src/database/stores/effect-store'
import FactionStore from '../../src/database/stores/faction-store'
import LeaderStore from '../../src/database/stores/leader-store'
import UnitStore from '../../src/database/stores/unit-store'
import { verifyCollectionNames } from './util/expect-util'

describe('upgrade-1', () => {
  const upgradeNumber = 1
  beforeEach(async () => {
    await DbUtil.deleteDatabase()
  })
  it('creates collection and indexes', async () => {
    const db = await DbConnector.connect()
    await verifyCollectionNames({
      db,
      names: [
        DlcStore.COLLECTION_NAME,
        EffectStore.COLLECTION_NAME,
        FactionStore.COLLECTION_NAME,
        LeaderStore.COLLECTION_NAME,
        UnitStore.COLLECTION_NAME,
      ],
      shouldExist: false,
    })

    await new DbUpgrader({}).run({
      upgrades: allUpgrades.slice(0, upgradeNumber),
    })

    await verifyCollectionNames({
      db,
      names: [
        DlcStore.COLLECTION_NAME,
        EffectStore.COLLECTION_NAME,
        FactionStore.COLLECTION_NAME,
        LeaderStore.COLLECTION_NAME,
        UnitStore.COLLECTION_NAME,
      ],
    })
    await expect(db.indexInformation(DlcStore.COLLECTION_NAME)).resolves.toEqual({
      _id_: [['_id', 1]],
      key_1: [['key', 1]],
      name_1: [['name', 1]],
    })
    await expect(db.indexInformation(EffectStore.COLLECTION_NAME)).resolves.toEqual({
      _id_: [['_id', 1]],
      key_1: [['key', 1]],
      name_1: [['name', 1]],
    })
    await expect(db.indexInformation(FactionStore.COLLECTION_NAME)).resolves.toEqual({
      _id_: [['_id', 1]],
      key_1: [['key', 1]],
      name_1: [['name', 1]],
    })
    await expect(db.indexInformation(LeaderStore.COLLECTION_NAME)).resolves.toEqual({
      _id_: [['_id', 1]],
      faction_1: [['faction', 1]],
      name_1: [['name', 1]],
    })
    await expect(db.indexInformation(UnitStore.COLLECTION_NAME)).resolves.toEqual({
      _id_: [['_id', 1]],
      faction_1_deckable_1: [
        ['faction', 1],
        ['deckable', 1],
      ],
      name_1__id_1: [
        ['name', 1],
        ['_id', 1],
      ],
    })
  })
})
