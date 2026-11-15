import AdminDb from '../../src/database/upgrades/admin-db'
import allUpgrades from '../../src/database/upgrades/all-upgrades'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import * as env from '../../src/env'

describe('upgrade-6', () => {
  const upgradeNumber = 6
  let fcv: string
  beforeAll(async () => {
    await DbConnector.connect()
    fcv = await AdminDb.getFeatureCompatibilityVersion()
  })
  beforeEach(async () => {
    await DbUtil.deleteDatabase()
  })
  afterAll(async () => {
    await AdminDb.setFeatureCompatibilityVersion(fcv)
  })
  it('does not upgrade fcv if less than desired by sync fcv false', async () => {
    const upgrader = new DbUpgrader({})
    await upgrader.run({
      upgrades: allUpgrades.slice(0, upgradeNumber - 1),
    })

    await AdminDb.setFeatureCompatibilityVersion('8.3')
    await expect(AdminDb.getFeatureCompatibilityVersion()).resolves.toEqual('8.3')

    jest.spyOn(env, 'default').mockReturnValue({
      SYNC_FCV: false,
    } as any)

    await upgrader.run({
      upgrades: allUpgrades.slice(0, upgradeNumber),
    })

    await expect(AdminDb.getFeatureCompatibilityVersion()).resolves.toEqual('8.3')
  })
  it('fcv remains unchanged if already at desired', async () => {
    const upgrader = new DbUpgrader({})
    await upgrader.run({
      upgrades: allUpgrades.slice(0, upgradeNumber - 1),
    })

    await AdminDb.setFeatureCompatibilityVersion('9.0')
    await expect(AdminDb.getFeatureCompatibilityVersion()).resolves.toEqual('9.0')

    await upgrader.run({
      upgrades: allUpgrades.slice(0, upgradeNumber),
    })

    await expect(AdminDb.getFeatureCompatibilityVersion()).resolves.toEqual('9.0')
  })
  it('updates fcv if it is less than desired', async () => {
    const upgrader = new DbUpgrader({})
    await upgrader.run({
      upgrades: allUpgrades.slice(0, upgradeNumber - 1),
    })

    await AdminDb.setFeatureCompatibilityVersion('8.3')
    await expect(AdminDb.getFeatureCompatibilityVersion()).resolves.toEqual('8.3')

    await upgrader.run({
      upgrades: allUpgrades.slice(0, upgradeNumber),
    })

    await expect(AdminDb.getFeatureCompatibilityVersion()).resolves.toEqual('9.0')
  })
})
