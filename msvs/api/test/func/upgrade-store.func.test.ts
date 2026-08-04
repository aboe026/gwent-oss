import { ObjectId } from 'mongodb'

import DbUtil from './util/db-util'
import UpgradeStore from '../../src/database/stores/upgrade-store'

describe('upgrade-store', () => {
  beforeEach(async () => {
    await DbUtil.deleteDatabase()
  })
  describe('addLock', () => {
    it('adds lock to database if none exist', async () => {
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)

      const lock = await UpgradeStore.addLock()

      expect(lock).toEqual({
        _id: UpgradeStore['LOCK_ID'],
        updated: expect.any(Date),
      })
      await expect(UpgradeStore.getLock()).resolves.toEqual(lock)
    })
    it('throws error if lock already exists', async () => {
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)

      const lock = await UpgradeStore.addLock()

      expect(lock).toEqual({
        _id: UpgradeStore['LOCK_ID'],
        updated: expect.any(Date),
      })
      await expect(UpgradeStore.getLock()).resolves.toEqual(lock)

      await expect(UpgradeStore.addLock()).rejects.toThrow(
        `E11000 duplicate key error collection: gwent-oss-func.upgrades index: _id_ dup key: { _id: ObjectId('${UpgradeStore[
          'LOCK_ID'
        ].toString()}') }`
      )

      await expect(UpgradeStore.getLock()).resolves.toEqual(lock)
    })
  })
  describe('updateLock', () => {
    it('updates the updated field on lock if it exists', async () => {
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)

      const lock = await UpgradeStore.addLock()

      expect(lock).toEqual({
        _id: UpgradeStore['LOCK_ID'],
        updated: expect.any(Date),
      })
      await expect(UpgradeStore.getLock()).resolves.toEqual(lock)

      const updatedLock = await UpgradeStore.updateLock()
      expect(updatedLock).toEqual({
        _id: UpgradeStore['LOCK_ID'],
        updated: expect.any(Date),
      })
      expect(updatedLock.updated.getTime()).toBeGreaterThan(lock.updated.getTime())
    })
    it('throws error if lock does not exist', async () => {
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)

      await expect(UpgradeStore.updateLock()).rejects.toEqual(
        Error(`Invalid ID "${UpgradeStore['LOCK_ID'].toString()}": Does not exist.`)
      )

      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
    })
  })
  describe('getLock', () => {
    it('returns undefined if lock does not exist', async () => {
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
    })
    it('returns lock if lock exists', async () => {
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
      const lock = await UpgradeStore.addLock()
      expect(lock).toEqual({
        _id: UpgradeStore['LOCK_ID'],
        updated: expect.any(Date),
      })

      await expect(UpgradeStore.getLock()).resolves.toEqual(lock)
    })
  })
  describe('deleteLock', () => {
    it('removes lock if it exists', async () => {
      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
      const lock = await UpgradeStore.addLock()
      expect(lock).toEqual({
        _id: UpgradeStore['LOCK_ID'],
        updated: expect.any(Date),
      })

      await expect(UpgradeStore.deleteLock()).resolves.toEqual(lock)

      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)
    })
  })
  describe('getCurrentVersion', () => {
    it('returns 0 if there are no upgrades', async () => {
      await expect(UpgradeStore.getUpgrades()).resolves.toEqual([])

      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(0)
    })
    it('returns version of upgrade if one exists', async () => {
      await expect(UpgradeStore.getUpgrades()).resolves.toEqual([])
      const upgrade = {
        version: 5,
        start: new Date(),
        end: new Date(),
      }
      await UpgradeStore.addUpgrade(upgrade)
      await expect(UpgradeStore.getUpgrades()).resolves.toEqual([
        {
          _id: expect.any(ObjectId),
          ...upgrade,
        },
      ])

      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(upgrade.version)
    })
    it('returns version of greatest upgrade if multiple exists', async () => {
      await expect(UpgradeStore.getUpgrades()).resolves.toEqual([])
      const upgrades = [
        {
          version: 5,
          start: new Date(),
          end: new Date(),
        },
        {
          version: 15,
          start: new Date(),
          end: new Date(),
        },
        {
          version: 10,
          start: new Date(),
          end: new Date(),
        },
      ]
      await UpgradeStore.addUpgrade(upgrades[0])
      await UpgradeStore.addUpgrade(upgrades[1])
      await UpgradeStore.addUpgrade(upgrades[2])
      await expect(UpgradeStore.getUpgrades()).resolves.toEqual([
        {
          _id: expect.any(ObjectId),
          ...upgrades[1],
        },
        {
          _id: expect.any(ObjectId),
          ...upgrades[2],
        },
        {
          _id: expect.any(ObjectId),
          ...upgrades[0],
        },
      ])

      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(upgrades[1].version)
    })
  })
  describe('addAttempt', () => {
    it('adds attempt to an empty database', async () => {
      await expect(UpgradeStore.getAttempts()).resolves.toEqual([])
      const attempt = {
        version: 1,
        time: new Date(),
      }

      const dbAttempt = await UpgradeStore.addAttempt(attempt)

      expect(dbAttempt).toEqual({
        _id: expect.any(ObjectId),
        ...attempt,
      })
      await expect(UpgradeStore.getAttempts()).resolves.toEqual([dbAttempt])
    })
    it('adds attempt when one already exists with different version', async () => {
      await expect(UpgradeStore.getAttempts()).resolves.toEqual([])
      const attempts = [
        {
          version: 1,
          time: new Date(),
        },
        {
          version: 2,
          time: new Date(),
        },
      ]

      const dbAttempt = await UpgradeStore.addAttempt(attempts[0])

      expect(dbAttempt).toEqual({
        _id: expect.any(ObjectId),
        ...attempts[0],
      })
      await expect(UpgradeStore.getAttempts()).resolves.toEqual([dbAttempt])

      const dbAttempt2 = await UpgradeStore.addAttempt(attempts[1])

      expect(dbAttempt2).toEqual({
        _id: expect.any(ObjectId),
        ...attempts[1],
      })
      await expect(UpgradeStore.getAttempts()).resolves.toEqual([dbAttempt, dbAttempt2])
    })
    it('adds attempt when one already exists with same version', async () => {
      await expect(UpgradeStore.getAttempts()).resolves.toEqual([])
      const attempts = [
        {
          version: 2,
          time: new Date(),
        },
        {
          version: 2,
          time: new Date(),
        },
      ]

      const dbAttempt = await UpgradeStore.addAttempt(attempts[0])

      expect(dbAttempt).toEqual({
        _id: expect.any(ObjectId),
        ...attempts[0],
      })
      await expect(UpgradeStore.getAttempts()).resolves.toEqual([dbAttempt])

      const dbAttempt2 = await UpgradeStore.addAttempt(attempts[1])

      expect(dbAttempt2).toEqual({
        _id: expect.any(ObjectId),
        ...attempts[1],
      })
      await expect(UpgradeStore.getAttempts()).resolves.toEqual([dbAttempt, dbAttempt2])
    })
  })
  describe('addUpgrade', () => {
    it('add upgrade to empty database', async () => {
      await expect(UpgradeStore.getUpgrades()).resolves.toEqual([])
      const upgrade = {
        version: 1,
        start: new Date(),
        end: new Date(),
      }

      const dbUpgrade = await UpgradeStore.addUpgrade(upgrade)

      expect(dbUpgrade).toEqual({
        _id: expect.any(ObjectId),
        ...upgrade,
      })
      await expect(UpgradeStore.getUpgrades()).resolves.toEqual([dbUpgrade])
    })
    it('adds upgrade when one already exists with different version', async () => {
      await expect(UpgradeStore.getUpgrades()).resolves.toEqual([])
      const upgrades = [
        {
          version: 1,
          start: new Date(),
          end: new Date(),
        },
        {
          version: 2,
          start: new Date(),
          end: new Date(),
        },
      ]

      const dbUpgrade = await UpgradeStore.addUpgrade(upgrades[0])

      expect(dbUpgrade).toEqual({
        _id: expect.any(ObjectId),
        ...upgrades[0],
      })
      await expect(UpgradeStore.getUpgrades()).resolves.toEqual([dbUpgrade])

      const dbUpgrade2 = await UpgradeStore.addUpgrade(upgrades[1])

      expect(dbUpgrade2).toEqual({
        _id: expect.any(ObjectId),
        ...upgrades[1],
      })
      await expect(UpgradeStore.getUpgrades()).resolves.toEqual([dbUpgrade2, dbUpgrade])
    })
    it('adds upgrade when one already exists with same version', async () => {
      await expect(UpgradeStore.getUpgrades()).resolves.toEqual([])
      const upgrades = [
        {
          version: 2,
          start: new Date(),
          end: new Date(),
        },
        {
          version: 2,
          start: new Date(),
          end: new Date(),
        },
      ]

      const dbUpgrade = await UpgradeStore.addUpgrade(upgrades[0])

      expect(dbUpgrade).toEqual({
        _id: expect.any(ObjectId),
        ...upgrades[0],
      })
      await expect(UpgradeStore.getUpgrades()).resolves.toEqual([dbUpgrade])

      const dbUpgrade2 = await UpgradeStore.addUpgrade(upgrades[1])

      expect(dbUpgrade2).toEqual({
        _id: expect.any(ObjectId),
        ...upgrades[1],
      })
      await expect(UpgradeStore.getUpgrades()).resolves.toEqual([dbUpgrade, dbUpgrade2])
    })
  })
})
