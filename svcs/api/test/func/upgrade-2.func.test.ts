import { ObjectId } from 'mongodb'

import cards from '../../src/database/upgrades/cards.json'
import CardStore from '../../src/database/card-store'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import upgrade1 from '../../src/database/upgrades/upgrade-1'
import upgrade2, { normalizeLeader, normalizeUnit } from '../../src/database/upgrades/upgrade-2'

describe('upgrade-2', () => {
  beforeEach(async () => {
    await DbUtil.deleteDatabase()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  it('creates cards', async () => {
    jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([upgrade1])
    await DbUpgrader.run()

    await expect(CardStore.getLeaders()).resolves.toEqual([])
    await expect(CardStore.getUnits()).resolves.toEqual([])

    jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([upgrade1, upgrade2])
    await DbUpgrader.run()

    await expect(CardStore.getLeaders()).resolves.toEqual(
      cards
        .filter((card) => card.Type === 'Leader')
        .map((card) => {
          return {
            _id: expect.any(ObjectId),
            ...normalizeLeader(card),
          }
        })
    )
    await expect(CardStore.getUnits()).resolves.toEqual(
      cards
        .filter((card) => card.Type !== 'Leader')
        .map((card) => {
          return {
            _id: expect.any(ObjectId),
            ...normalizeUnit(card),
          }
        })
    )
  })
})
