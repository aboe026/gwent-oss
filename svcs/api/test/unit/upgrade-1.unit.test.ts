import DbConnector from '../../src/database/db-connector'
import DlcStore from '../../src/database/stores/dlc-store'
import EffectStore from '../../src/database/stores/effect-store'
import FactionStore from '../../src/database/stores/faction-store'
import LeaderStore from '../../src/database/stores/leader-store'
import UnitStore from '../../src/database/stores/unit-store'
import Upgrade1 from '../../src/database/upgrades/upgrade-1'

describe('upgrade-1', () => {
  it('calls to create resource collection and indexes', async () => {
    const debugSpy = jest.fn().mockImplementation()
    Upgrade1.logger = {
      debug: debugSpy,
    } as any
    const createCollectionSpy = jest.fn().mockImplementation()
    const createIndexSpy = jest.fn().mockImplementation()
    jest.spyOn(DbConnector, 'connect').mockResolvedValue({
      createCollection: createCollectionSpy,
      createIndex: createIndexSpy,
    } as any)

    await expect(new Upgrade1().run()).resolves.toEqual(undefined)

    expect(debugSpy.mock.calls).toEqual([
      ['Connecting to database'],
      [`Creating collection "${DlcStore.COLLECTION_NAME}"`],
      [`Creating index on collection "${DlcStore.COLLECTION_NAME}" for name:1 unique`],
      [`Creating index on collection "${DlcStore.COLLECTION_NAME}" for key:1 unique`],
      [`Creating collection "${EffectStore.COLLECTION_NAME}"`],
      [`Creating index on collection "${EffectStore.COLLECTION_NAME}" for name:1 unique`],
      [`Creating index on collection "${EffectStore.COLLECTION_NAME}" for key:1 unique`],
      [`Creating collection "${FactionStore.COLLECTION_NAME}"`],
      [`Creating index on collection "${FactionStore.COLLECTION_NAME}" for name:1 unique`],
      [`Creating index on collection "${FactionStore.COLLECTION_NAME}" for key:1 unique`],
      [`Creating collection "${LeaderStore.COLLECTION_NAME}"`],
      [`Creating index on collection "${LeaderStore.COLLECTION_NAME}" for name:1 unique`],
      [`Creating index on collection "${LeaderStore.COLLECTION_NAME}" for faction:1`],
      [`Creating collection "${UnitStore.COLLECTION_NAME}"`],
      [`Creating index on collection "${UnitStore.COLLECTION_NAME}" for faction:1,deckable:1`],
    ])
    expect(createCollectionSpy.mock.calls).toEqual([
      [DlcStore.COLLECTION_NAME],
      [EffectStore.COLLECTION_NAME],
      [FactionStore.COLLECTION_NAME],
      [LeaderStore.COLLECTION_NAME],
      [UnitStore.COLLECTION_NAME],
    ])
    expect(createIndexSpy.mock.calls).toEqual([
      [
        DlcStore.COLLECTION_NAME,
        {
          name: 1,
        },
        {
          unique: true,
        },
      ],
      [
        DlcStore.COLLECTION_NAME,
        {
          key: 1,
        },
        {
          unique: true,
        },
      ],
      [
        EffectStore.COLLECTION_NAME,
        {
          name: 1,
        },
        {
          unique: true,
        },
      ],
      [
        EffectStore.COLLECTION_NAME,
        {
          key: 1,
        },
        {
          unique: true,
        },
      ],
      [
        FactionStore.COLLECTION_NAME,
        {
          name: 1,
        },
        {
          unique: true,
        },
      ],
      [
        FactionStore.COLLECTION_NAME,
        {
          key: 1,
        },
        {
          unique: true,
        },
      ],
      [
        LeaderStore.COLLECTION_NAME,
        {
          name: 1,
        },
        {
          unique: true,
        },
      ],
      [
        LeaderStore.COLLECTION_NAME,
        {
          faction: 1,
        },
      ],
      [
        UnitStore.COLLECTION_NAME,
        {
          faction: 1,
          deckable: 1,
        },
      ],
    ])
  })
})
