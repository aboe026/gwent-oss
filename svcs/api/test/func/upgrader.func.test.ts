import { ObjectId } from 'mongodb'

import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import UpgradeStore from '../../src/database/stores/upgrade-store'
import Upgrade from '../../src/database/upgrades/upgrade'

describe('upgrader', () => {
  beforeEach(async () => {
    await DbUtil.deleteDatabase()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  describe('run', () => {
    it('does not create attempt or upgrade if no upgrades', async () => {
      const db = await DbConnector.connect()
      await expect(db.listCollections().toArray()).resolves.toEqual([])

      jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([])

      await expect(DbUpgrader.run()).resolves.toEqual(undefined)

      const collections = await db.listCollections().toArray()
      expect(collections?.map((collection) => collection.name)).toEqual(
        expect.arrayContaining([UpgradeStore.COLLECTION_NAME])
      )
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
      await expect(UpgradeStore.getAttempts()).resolves.toEqual([])
      await expect(UpgradeStore.getUpgrades()).resolves.toEqual([])
      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(0)
    })
    it('creates single attempt and upgrade if single successful upgrade', async () => {
      const db = await DbConnector.connect()
      await expect(db.listCollections().toArray()).resolves.toEqual([])

      jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([new TestUpgrade()])
      const start = Date.now()

      await expect(DbUpgrader.run()).resolves.toEqual(undefined)

      const end = Date.now()
      const collections = await db.listCollections().toArray()
      expect(collections?.map((collection) => collection.name)).toEqual(
        expect.arrayContaining([UpgradeStore.COLLECTION_NAME])
      )
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
      const attempts = await UpgradeStore.getAttempts()
      expect(attempts).toEqual([
        {
          _id: expect.any(ObjectId),
          version: 1,
          time: expect.any(Date),
        },
      ])
      const upgrades = await UpgradeStore.getUpgrades()
      expect(upgrades).toEqual([
        {
          _id: expect.any(ObjectId),
          version: 1,
          start: expect.any(Date),
          end: expect.any(Date),
        },
      ])
      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(1)
      expect(attempts[0].time.getTime()).toBeGreaterThan(start)
      expect(attempts[0].time.getTime()).toBeLessThan(end)
      expect(upgrades[0].start.getTime()).toBeGreaterThan(start)
      expect(upgrades[0].start.getTime()).toBeLessThan(end)
      expect(upgrades[0].end.getTime()).toBeGreaterThan(start)
      expect(upgrades[0].end.getTime()).toBeLessThan(end)
      expect(upgrades[0].start.getTime()).toBeLessThan(upgrades[0].end.getTime())
      expect(attempts[0].time.getTime()).toEqual(upgrades[0].start.getTime())
    })
    it('creates single attempt and no upgrade if single failed upgrade', async () => {
      const error = 'whoops'
      const db = await DbConnector.connect()
      await expect(db.listCollections().toArray()).resolves.toEqual([])

      const testUpgrade = new TestUpgrade()
      jest.spyOn(testUpgrade, 'run').mockRejectedValue(Error(error))
      jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([testUpgrade])
      const start = Date.now()

      await expect(DbUpgrader.run()).rejects.toThrow(error)

      const end = Date.now()
      const collections = await db.listCollections().toArray()
      expect(collections?.map((collection) => collection.name)).toEqual(
        expect.arrayContaining([UpgradeStore.COLLECTION_NAME])
      )
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
      const attempts = await UpgradeStore.getAttempts()
      expect(attempts).toEqual([
        {
          _id: expect.any(ObjectId),
          version: 1,
          time: expect.any(Date),
        },
      ])
      const upgrades = await UpgradeStore.getUpgrades()
      expect(upgrades).toEqual([])
      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(0)
      expect(attempts[0].time.getTime()).toBeGreaterThan(start)
      expect(attempts[0].time.getTime()).toBeLessThan(end)
    })
    it('creates no upgrades or attempts if running true', async () => {
      try {
        const db = await DbConnector.connect()
        await expect(db.listCollections().toArray()).resolves.toEqual([])

        jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([])
        DbUpgrader['running'] = true

        await expect(DbUpgrader.run()).rejects.toThrow('Already attempting to run an upgrade')

        await expect(db.listCollections().toArray()).resolves.toEqual([])
      } finally {
        DbUpgrader['running'] = false
      }
    })
    it('creates no attempts or upgrades if lock already taken and never relinquished', async () => {
      const origTimeout = DbUpgrader['LOCK_TIMEOUT_SECONDS']
      const newTimeout = 2
      try {
        DbUpgrader['LOCK_TIMEOUT_SECONDS'] = newTimeout
        const db = await DbConnector.connect()
        await expect(db.listCollections().toArray()).resolves.toEqual([])

        jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([new TestUpgrade()])
        const start = Date.now()
        const expires = new Date(start + 1000 * newTimeout * 2)

        await FuncTestLock.addLockOverride(expires) // manually add lock that expires after the timeout threshold

        await expect(DbUpgrader.run()).rejects.toThrow(/Could not aquire lock after "2\.\d+" seconds/)

        const collections = await db.listCollections().toArray()
        expect(collections?.map((collection) => collection.name)).toEqual(
          expect.arrayContaining([UpgradeStore.COLLECTION_NAME])
        )
        await expect(UpgradeStore.getLock()).resolves.toEqual({
          _id: UpgradeStore['LOCK_ID'],
          updated: expires,
        })
        const attempts = await UpgradeStore.getAttempts()
        expect(attempts).toEqual([])
        const upgrades = await UpgradeStore.getUpgrades()
        expect(upgrades).toEqual([])
        await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(0)
      } finally {
        DbUpgrader['LOCK_TIMEOUT_SECONDS'] = origTimeout
        await UpgradeStore.deleteLock()
      }
    })
    it('creates attempt and upgrade if previous lock expired', async () => {
      const origTimeout = DbUpgrader['LOCK_TIMEOUT_SECONDS']
      const newTimeout = 2 // speed up test by allowing upgrader to delete expired lock sooner
      try {
        DbUpgrader['LOCK_TIMEOUT_SECONDS'] = newTimeout
        const db = await DbConnector.connect()
        await expect(db.listCollections().toArray()).resolves.toEqual([])

        jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([new TestUpgrade()])
        const start = Date.now()

        await FuncTestLock.addLockOverride(new Date(start - 1000)) // manually add lock that expired before upgrade is run

        await expect(DbUpgrader.run()).resolves.toEqual(undefined)

        const end = Date.now()
        const collections = await db.listCollections().toArray()
        expect(collections?.map((collection) => collection.name)).toEqual(
          expect.arrayContaining([UpgradeStore.COLLECTION_NAME])
        )
        await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
        const attempts = await UpgradeStore.getAttempts()
        expect(attempts).toEqual([
          {
            _id: expect.any(ObjectId),
            version: 1,
            time: expect.any(Date),
          },
        ])
        const upgrades = await UpgradeStore.getUpgrades()
        expect(upgrades).toEqual([
          {
            _id: expect.any(ObjectId),
            version: 1,
            start: expect.any(Date),
            end: expect.any(Date),
          },
        ])
        await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(1)
        expect(attempts[0].time.getTime()).toBeGreaterThan(start)
        expect(attempts[0].time.getTime()).toBeLessThan(end)
        expect(upgrades[0].start.getTime()).toBeGreaterThan(start)
        expect(upgrades[0].start.getTime()).toBeLessThan(end)
        expect(upgrades[0].end.getTime()).toBeGreaterThan(start)
        expect(upgrades[0].end.getTime()).toBeLessThan(end)
        expect(upgrades[0].start.getTime()).toBeLessThan(upgrades[0].end.getTime())
        expect(attempts[0].time.getTime()).toEqual(upgrades[0].start.getTime())
      } finally {
        DbUpgrader['LOCK_TIMEOUT_SECONDS'] = origTimeout
      }
    })
    it('creates two attempts and upgrades if double successful upgrade', async () => {
      const db = await DbConnector.connect()
      await expect(db.listCollections().toArray()).resolves.toEqual([])

      jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([new TestUpgrade(), new TestUpgrade()])
      const start = Date.now()

      await expect(DbUpgrader.run()).resolves.toEqual(undefined)

      const end = Date.now()
      const collections = await db.listCollections().toArray()
      expect(collections?.map((collection) => collection.name)).toEqual(
        expect.arrayContaining([UpgradeStore.COLLECTION_NAME])
      )
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
      const attempts = await UpgradeStore.getAttempts()
      expect(attempts).toEqual([
        {
          _id: expect.any(ObjectId),
          version: 2,
          time: expect.any(Date),
        },
        {
          _id: expect.any(ObjectId),
          version: 1,
          time: expect.any(Date),
        },
      ])
      const upgrades = await UpgradeStore.getUpgrades()
      expect(upgrades).toEqual([
        {
          _id: expect.any(ObjectId),
          version: 2,
          start: expect.any(Date),
          end: expect.any(Date),
        },
        {
          _id: expect.any(ObjectId),
          version: 1,
          start: expect.any(Date),
          end: expect.any(Date),
        },
      ])
      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(2)
      expect(attempts[0].time.getTime()).toBeGreaterThan(start)
      expect(attempts[0].time.getTime()).toBeLessThan(end)
      expect(attempts[1].time.getTime()).toBeGreaterThan(start)
      expect(attempts[1].time.getTime()).toBeLessThan(end)
      expect(attempts[0].time.getTime()).toBeGreaterThan(attempts[1].time.getTime())
      expect(upgrades[0].start.getTime()).toBeGreaterThan(start)
      expect(upgrades[0].start.getTime()).toBeLessThan(end)
      expect(upgrades[1].start.getTime()).toBeGreaterThan(start)
      expect(upgrades[1].start.getTime()).toBeLessThan(end)
      expect(upgrades[0].end.getTime()).toBeGreaterThan(start)
      expect(upgrades[0].end.getTime()).toBeLessThan(end)
      expect(upgrades[1].end.getTime()).toBeGreaterThan(start)
      expect(upgrades[1].end.getTime()).toBeLessThan(end)
      expect(upgrades[0].start.getTime()).toBeLessThan(upgrades[0].end.getTime())
      expect(upgrades[1].start.getTime()).toBeLessThan(upgrades[1].end.getTime())
      expect(upgrades[0].start.getTime()).toBeGreaterThan(upgrades[1].end.getTime())
      expect(attempts[0].time.getTime()).toEqual(upgrades[0].start.getTime())
      expect(attempts[1].time.getTime()).toEqual(upgrades[1].start.getTime())
    })
    it('creates single attempt and no upgrades if first upgrade fails out of two', async () => {
      const error = 'first-fail'
      const db = await DbConnector.connect()
      await expect(db.listCollections().toArray()).resolves.toEqual([])

      const testUpgrade = new TestUpgrade()
      jest.spyOn(testUpgrade, 'run').mockRejectedValue(Error(error))
      jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([testUpgrade, new TestUpgrade()])
      const start = Date.now()

      await expect(DbUpgrader.run()).rejects.toThrow(error)

      const end = Date.now()
      const collections = await db.listCollections().toArray()
      expect(collections?.map((collection) => collection.name)).toEqual(
        expect.arrayContaining([UpgradeStore.COLLECTION_NAME])
      )
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
      const attempts = await UpgradeStore.getAttempts()
      expect(attempts).toEqual([
        {
          _id: expect.any(ObjectId),
          version: 1,
          time: expect.any(Date),
        },
      ])
      const upgrades = await UpgradeStore.getUpgrades()
      expect(upgrades).toEqual([])
      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(0)
      expect(attempts[0].time.getTime()).toBeGreaterThan(start)
      expect(attempts[0].time.getTime()).toBeLessThan(end)
    })
    it('creates two attempts single upgrade if second upgrade fails out of two', async () => {
      const error = 'second-fail'
      const db = await DbConnector.connect()
      await expect(db.listCollections().toArray()).resolves.toEqual([])

      const testUpgrade = new TestUpgrade()
      jest.spyOn(testUpgrade, 'run').mockRejectedValue(Error(error))
      jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([new TestUpgrade(), testUpgrade])
      const start = Date.now()

      await expect(DbUpgrader.run()).rejects.toThrow(error)

      const end = Date.now()
      const collections = await db.listCollections().toArray()
      expect(collections?.map((collection) => collection.name)).toEqual(
        expect.arrayContaining([UpgradeStore.COLLECTION_NAME])
      )
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
      const attempts = await UpgradeStore.getAttempts()
      expect(attempts).toEqual([
        {
          _id: expect.any(ObjectId),
          version: 2,
          time: expect.any(Date),
        },
        {
          _id: expect.any(ObjectId),
          version: 1,
          time: expect.any(Date),
        },
      ])
      const upgrades = await UpgradeStore.getUpgrades()
      expect(upgrades).toEqual([
        {
          _id: expect.any(ObjectId),
          version: 1,
          start: expect.any(Date),
          end: expect.any(Date),
        },
      ])
      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(1)
      expect(attempts[0].time.getTime()).toBeGreaterThan(start)
      expect(attempts[0].time.getTime()).toBeLessThan(end)
      expect(attempts[1].time.getTime()).toBeGreaterThan(start)
      expect(attempts[1].time.getTime()).toBeLessThan(end)
      expect(attempts[0].time.getTime()).toBeGreaterThan(attempts[1].time.getTime())
      expect(upgrades[0].start.getTime()).toBeGreaterThan(start)
      expect(upgrades[0].start.getTime()).toBeLessThan(end)
      expect(upgrades[0].end.getTime()).toBeGreaterThan(start)
      expect(upgrades[0].end.getTime()).toBeLessThan(end)
      expect(upgrades[0].start.getTime()).toBeLessThan(upgrades[0].end.getTime())
      expect(attempts[0].time.getTime()).toBeGreaterThan(upgrades[0].start.getTime())
      expect(attempts[1].time.getTime()).toEqual(upgrades[0].start.getTime())
    })
    it('does not create attempt or upgrade if rerun after no upgrades', async () => {
      const db = await DbConnector.connect()
      await expect(db.listCollections().toArray()).resolves.toEqual([])

      jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([])

      await expect(DbUpgrader.run()).resolves.toEqual(undefined)

      const collections = await db.listCollections().toArray()
      expect(collections?.map((collection) => collection.name)).toEqual(
        expect.arrayContaining([UpgradeStore.COLLECTION_NAME])
      )
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
      await expect(UpgradeStore.getAttempts()).resolves.toEqual([])
      await expect(UpgradeStore.getUpgrades()).resolves.toEqual([])
      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(0)

      await expect(DbUpgrader.run()).resolves.toEqual(undefined)

      const reRanCollections = await db.listCollections().toArray()
      expect(reRanCollections?.map((collection) => collection.name)).toEqual(
        expect.arrayContaining([UpgradeStore.COLLECTION_NAME])
      )
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
      await expect(UpgradeStore.getAttempts()).resolves.toEqual([])
      await expect(UpgradeStore.getUpgrades()).resolves.toEqual([])
      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(0)
    })
    it('does not create more attempts or upgrades if rerun after single upgrade', async () => {
      const db = await DbConnector.connect()
      await expect(db.listCollections().toArray()).resolves.toEqual([])

      jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([new TestUpgrade()])
      const start = Date.now()

      await expect(DbUpgrader.run()).resolves.toEqual(undefined)

      const end = Date.now()
      const collections = await db.listCollections().toArray()
      expect(collections?.map((collection) => collection.name)).toEqual(
        expect.arrayContaining([UpgradeStore.COLLECTION_NAME])
      )
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
      const attempts = await UpgradeStore.getAttempts()
      expect(attempts).toEqual([
        {
          _id: expect.any(ObjectId),
          version: 1,
          time: expect.any(Date),
        },
      ])
      const upgrades = await UpgradeStore.getUpgrades()
      expect(upgrades).toEqual([
        {
          _id: expect.any(ObjectId),
          version: 1,
          start: expect.any(Date),
          end: expect.any(Date),
        },
      ])
      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(1)
      expect(attempts[0].time.getTime()).toBeGreaterThan(start)
      expect(attempts[0].time.getTime()).toBeLessThan(end)
      expect(upgrades[0].start.getTime()).toBeGreaterThan(start)
      expect(upgrades[0].start.getTime()).toBeLessThan(end)
      expect(upgrades[0].end.getTime()).toBeGreaterThan(start)
      expect(upgrades[0].end.getTime()).toBeLessThan(end)
      expect(upgrades[0].start.getTime()).toBeLessThan(upgrades[0].end.getTime())
      expect(attempts[0].time.getTime()).toEqual(upgrades[0].start.getTime())

      await expect(DbUpgrader.run()).resolves.toEqual(undefined)

      const reRanCollections = await db.listCollections().toArray()
      expect(reRanCollections?.map((collection) => collection.name)).toEqual(
        expect.arrayContaining([UpgradeStore.COLLECTION_NAME])
      )
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
      await expect(UpgradeStore.getAttempts()).resolves.toEqual(attempts)
      await expect(UpgradeStore.getUpgrades()).resolves.toEqual(upgrades)
      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(1)
    })
    it('creates another attempt and upgrade if run single upgrade after single upgrade', async () => {
      const db = await DbConnector.connect()
      await expect(db.listCollections().toArray()).resolves.toEqual([])

      jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([new TestUpgrade()])
      const start = Date.now()

      await expect(DbUpgrader.run()).resolves.toEqual(undefined)

      const end = Date.now()
      const collections = await db.listCollections().toArray()
      expect(collections?.map((collection) => collection.name)).toEqual(
        expect.arrayContaining([UpgradeStore.COLLECTION_NAME])
      )
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
      const attempts = await UpgradeStore.getAttempts()
      expect(attempts).toEqual([
        {
          _id: expect.any(ObjectId),
          version: 1,
          time: expect.any(Date),
        },
      ])
      const upgrades = await UpgradeStore.getUpgrades()
      expect(upgrades).toEqual([
        {
          _id: expect.any(ObjectId),
          version: 1,
          start: expect.any(Date),
          end: expect.any(Date),
        },
      ])
      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(1)
      expect(attempts[0].time.getTime()).toBeGreaterThan(start)
      expect(attempts[0].time.getTime()).toBeLessThan(end)
      expect(upgrades[0].start.getTime()).toBeGreaterThan(start)
      expect(upgrades[0].start.getTime()).toBeLessThan(end)
      expect(upgrades[0].end.getTime()).toBeGreaterThan(start)
      expect(upgrades[0].end.getTime()).toBeLessThan(end)
      expect(upgrades[0].start.getTime()).toBeLessThan(upgrades[0].end.getTime())
      expect(attempts[0].time.getTime()).toEqual(upgrades[0].start.getTime())

      jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([new TestUpgrade(), new TestUpgrade()])
      const secondStart = Date.now()

      await expect(DbUpgrader.run()).resolves.toEqual(undefined)

      const secondEnd = Date.now()
      const reRanCollections = await db.listCollections().toArray()
      expect(reRanCollections?.map((collection) => collection.name)).toEqual(
        expect.arrayContaining([UpgradeStore.COLLECTION_NAME])
      )
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
      const reRanAttempts = await UpgradeStore.getAttempts()
      expect(reRanAttempts).toEqual([
        {
          _id: expect.any(ObjectId),
          version: 2,
          time: expect.any(Date),
        },
        {
          _id: expect.any(ObjectId),
          version: 1,
          time: expect.any(Date),
        },
      ])
      const reRanUpgrades = await UpgradeStore.getUpgrades()
      expect(reRanUpgrades).toEqual([
        {
          _id: expect.any(ObjectId),
          version: 2,
          start: expect.any(Date),
          end: expect.any(Date),
        },
        {
          _id: expect.any(ObjectId),
          version: 1,
          start: expect.any(Date),
          end: expect.any(Date),
        },
      ])
      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(2)
      expect(reRanAttempts[1]).toEqual(attempts[0])
      expect(reRanUpgrades[1]).toEqual(upgrades[0])
      expect(reRanAttempts[0].time.getTime()).toBeGreaterThan(secondStart)
      expect(reRanAttempts[0].time.getTime()).toBeLessThan(secondEnd)
      expect(reRanUpgrades[0].start.getTime()).toBeGreaterThan(secondStart)
      expect(reRanUpgrades[0].start.getTime()).toBeLessThan(secondEnd)
      expect(reRanUpgrades[0].end.getTime()).toBeGreaterThan(secondStart)
      expect(reRanUpgrades[0].end.getTime()).toBeLessThan(secondEnd)
      expect(reRanUpgrades[0].start.getTime()).toBeLessThan(reRanUpgrades[0].end.getTime())
      expect(reRanAttempts[0].time.getTime()).toEqual(reRanUpgrades[0].start.getTime())

      expect(reRanAttempts[1].time.getTime()).toBeGreaterThan(start)
      expect(reRanAttempts[1].time.getTime()).toBeLessThan(end)
      expect(reRanUpgrades[1].start.getTime()).toBeGreaterThan(start)
      expect(reRanUpgrades[1].start.getTime()).toBeLessThan(end)
      expect(reRanUpgrades[1].end.getTime()).toBeGreaterThan(start)
      expect(reRanUpgrades[1].end.getTime()).toBeLessThan(end)
      expect(reRanUpgrades[1].start.getTime()).toBeLessThan(reRanUpgrades[1].end.getTime())
      expect(reRanAttempts[1].time.getTime()).toEqual(reRanUpgrades[1].start.getTime())

      expect(reRanAttempts[0].time.getTime()).toBeGreaterThan(reRanAttempts[1].time.getTime())
      expect(reRanUpgrades[0].start.getTime()).toBeGreaterThan(reRanUpgrades[1].end.getTime())
    })
    it('creates another attempt and single upgrade if rerun after upgrade fail', async () => {
      const error = 'first-fail'
      const db = await DbConnector.connect()
      await expect(db.listCollections().toArray()).resolves.toEqual([])

      const testUpgrade = new TestUpgrade()
      jest.spyOn(testUpgrade, 'run').mockRejectedValue(Error(error))
      jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([testUpgrade])
      const start = Date.now()

      await expect(DbUpgrader.run()).rejects.toThrow(error)

      const end = Date.now()
      const collections = await db.listCollections().toArray()
      expect(collections?.map((collection) => collection.name)).toEqual(
        expect.arrayContaining([UpgradeStore.COLLECTION_NAME])
      )
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
      const attempts = await UpgradeStore.getAttempts()
      expect(attempts).toEqual([
        {
          _id: expect.any(ObjectId),
          version: 1,
          time: expect.any(Date),
        },
      ])
      const upgrades = await UpgradeStore.getUpgrades()
      expect(upgrades).toEqual([])
      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(0)
      expect(attempts[0].time.getTime()).toBeGreaterThan(start)
      expect(attempts[0].time.getTime()).toBeLessThan(end)

      jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue([new TestUpgrade()])
      const secondStart = Date.now()

      await expect(DbUpgrader.run()).resolves.toEqual(undefined)

      const secondEnd = Date.now()
      const reRanCollections = await db.listCollections().toArray()
      expect(reRanCollections?.map((collection) => collection.name)).toEqual(
        expect.arrayContaining([UpgradeStore.COLLECTION_NAME])
      )
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
      const reRanAttempts = await UpgradeStore.getAttempts()
      expect(reRanAttempts).toEqual([
        {
          _id: expect.any(ObjectId),
          version: 1,
          time: expect.any(Date),
        },
        {
          _id: expect.any(ObjectId),
          version: 1,
          time: expect.any(Date),
        },
      ])
      const reRanUpgrades = await UpgradeStore.getUpgrades()
      expect(reRanUpgrades).toEqual([
        {
          _id: expect.any(ObjectId),
          version: 1,
          start: expect.any(Date),
          end: expect.any(Date),
        },
      ])
      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(1)
      expect(reRanAttempts[1]).toEqual(attempts[0])
      expect(reRanAttempts[0].time.getTime()).toBeGreaterThan(secondStart)
      expect(reRanAttempts[0].time.getTime()).toBeLessThan(secondEnd)
      expect(reRanAttempts[0].time.getTime()).toBeGreaterThan(reRanAttempts[1].time.getTime())
      expect(reRanUpgrades[0].start.getTime()).toBeGreaterThan(secondStart)
      expect(reRanUpgrades[0].start.getTime()).toBeLessThan(secondEnd)
      expect(reRanUpgrades[0].end.getTime()).toBeGreaterThan(secondStart)
      expect(reRanUpgrades[0].end.getTime()).toBeLessThan(secondEnd)
      expect(reRanUpgrades[0].start.getTime()).toBeLessThan(reRanUpgrades[0].end.getTime())
      expect(reRanAttempts[0].time.getTime()).toEqual(reRanUpgrades[0].start.getTime())
      expect(reRanAttempts[1].time.getTime()).toBeLessThan(reRanUpgrades[0].start.getTime())
    })
  })
})

class TestUpgrade extends Upgrade {
  async run() {
    await Promise.resolve()
  }
}

class FuncTestLock extends UpgradeStore {
  static async addLockOverride(time: Date) {
    return FuncTestLock.create({
      _id: FuncTestLock['LOCK_ID'],
      updated: time,
    })
  }
}
