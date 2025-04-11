import { ObjectId } from 'mongodb'

import allUpgrades from '../../src/database/upgrades/all-upgrades'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import DlcStore from '../../src/database/stores/dlc-store'
import EffectStore from '../../src/database/stores/effect-store'
import {
  expectizeDlcs,
  expectizeEffects,
  expectizeFactions,
  expectizeLeaders,
  expectizeUnits,
  verifyMongoIds,
} from './util/expect-util'
import FactionStore from '../../src/database/stores/faction-store'
import LeaderStore from '../../src/database/stores/leader-store'
import UnitStore from '../../src/database/stores/unit-store'

describe('upgrade-2', () => {
  const upgradeNumber = 2
  beforeEach(async () => {
    await DbUtil.deleteDatabase()
  })
  it('creates resources', async () => {
    jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue(allUpgrades.slice(0, upgradeNumber - 1))
    await DbUpgrader.run()

    await expect(DlcStore.get({})).resolves.toEqual([])
    await expect(EffectStore.get({})).resolves.toEqual([])
    await expect(FactionStore.get({})).resolves.toEqual([])
    await expect(LeaderStore.get({})).resolves.toEqual([])
    await expect(UnitStore.get({})).resolves.toEqual([])

    jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue(allUpgrades.slice(0, upgradeNumber))
    await DbUpgrader.run()

    const dlcs = await DlcStore.get({})
    expect(dlcs).toEqual(
      expectizeDlcs().map((dlc: any) => {
        dlc._id = expect.any(ObjectId)
        delete dlc.id
        return dlc
      })
    )
    verifyMongoIds(dlcs, '_id')

    const effects = await EffectStore.get({})
    expect(effects).toEqual(
      expectizeEffects().map((effect: any) => {
        effect._id = expect.any(ObjectId)
        delete effect.id
        return effect
      })
    )
    verifyMongoIds(effects, '_id')

    const factions = await FactionStore.get({})
    expect(factions).toEqual(
      expectizeFactions().map((faction: any) => {
        faction._id = expect.any(ObjectId)
        delete faction.id
        faction.dlc = faction.dlc ? expect.any(ObjectId) : null
        return faction
      })
    )
    verifyMongoIds(factions, '_id')

    const leaders = await LeaderStore.get({})
    expect(leaders).toEqual(
      expectizeLeaders().map((leader: any) => {
        leader._id = expect.any(ObjectId)
        delete leader.id
        leader.dlc = leader.dlc ? expect.any(ObjectId) : null
        leader.faction = expect.any(ObjectId)
        return leader
      })
    )
    verifyMongoIds(leaders, '_id')

    const units = await UnitStore.get({})
    expect(units).toEqual(
      expectizeUnits().map((unit: any) => {
        unit._id = expect.any(ObjectId)
        delete unit.id
        unit.dlc = unit.dlc ? expect.any(ObjectId) : null
        unit.faction = expect.any(ObjectId)
        if (unit.effects) {
          unit.effects = unit.effects.map(() => expect.any(ObjectId))
        }
        return unit
      })
    )
    verifyMongoIds(units, '_id')
  })
})
