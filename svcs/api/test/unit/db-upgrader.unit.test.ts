import fs from 'fs-extra'
import path from 'path'

import { MongoError, ObjectId } from 'mongodb'

describe('db-upgrader', () => {
  describe('getUpgrades', () => {
    it('returns the same length as there are upgrade scripts', async () => {
      const DbUpgrader = require('../../src/database/db-upgrader').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const upgradeFiles = await fs.readdir(path.join(__dirname, '../../src/database/upgrades'))
      const upgradeScripts = upgradeFiles.filter((upgradeFile) => upgradeFile.match(/^upgrade-\d+\.ts$/))

      expect(DbUpgrader.getUpgrades()).toHaveLength(upgradeScripts.length)
    })
  })
  describe('run', () => {
    it('throws error if running is true', async () => {
      const DbUpgrader = require('../../src/database/db-upgrader').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      DbUpgrader.running = true

      await expect(DbUpgrader.run()).rejects.toThrow('Already attempting to run an upgrade')
    })
    it('does not run upgrades if current version is 0 and no upgrades', async () => {
      const debugSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          debug: debugSpy,
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      jest.spyOn(UpgradeStore, 'getCurrentVersion').mockResolvedValue(0)
      jest.spyOn(UpgradeStore, 'deleteLock').mockImplementation()
      const DbUpgrader = require('../../src/database/db-upgrader').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      jest.spyOn(DbUpgrader, 'getUpgrades').mockReturnValue([])
      jest.spyOn(DbUpgrader, 'aquireLock').mockImplementation()

      await expect(DbUpgrader.run()).resolves.toEqual(undefined)

      expect(debugSpy.mock.calls).toEqual([
        ['Setting running to true to prevent concurrent upgrade runs'],
        ['Current version: "0"'],
        ['allUpgrades has "0" upgrades'],
        ['No new upgrades to run'],
        ['Deleting lock'],
        ['Setting running to false so other upgrade runs can occur'],
      ])
    })
    it('runs single upgrade if one to run and none run before', async () => {
      const debugSpy = jest.fn().mockImplementation()
      const infoSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          debug: debugSpy,
          info: infoSpy,
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      jest.spyOn(UpgradeStore, 'getCurrentVersion').mockResolvedValue(0)
      jest.spyOn(UpgradeStore, 'deleteLock').mockImplementation()
      const addAttemptSpy = jest.spyOn(UpgradeStore, 'addAttempt').mockImplementation()
      const addUpgradeSpy = jest.spyOn(UpgradeStore, 'addUpgrade').mockImplementation()
      const updateLockSpy = jest.spyOn(UpgradeStore, 'updateLock').mockImplementation()
      const sleep = require('../../src/util/sleep') // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const sleepSpy = jest.spyOn(sleep, 'default').mockImplementation()
      const DbUpgrader = require('../../src/database/db-upgrader').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const upgrade = jest.fn().mockImplementation()
      jest.spyOn(DbUpgrader, 'getUpgrades').mockReturnValue([upgrade]) // eslint-disable-line @typescript-eslint/no-empty-function
      jest.spyOn(DbUpgrader, 'aquireLock').mockImplementation()
      const start = new Date()
      const end = new Date(start.getTime() + 1000)
      const dateSpy = jest.spyOn(global, 'Date').mockReturnValueOnce(start).mockReturnValueOnce(end)

      await expect(DbUpgrader.run()).resolves.toEqual(undefined)

      expect(debugSpy.mock.calls).toEqual([
        ['Setting running to true to prevent concurrent upgrade runs'],
        ['Current version: "0"'],
        ['allUpgrades has "1" upgrades'],
        ['Found "1" new upgrade(s) to run'],
        [`sleeping: "${DbUpgrader.LOCK_REFRESH_SECONDS}" second(s) before updating lock timeout`],
        ['finished: "false"'],
        ['Updating lock timeout'],
        [`sleeping: "${DbUpgrader.LOCK_REFRESH_SECONDS}" second(s) before updating lock timeout`],
        ['setting finished to true'],
        ['finished: "true"'],
        ['Deleting lock'],
        ['Setting running to false so other upgrade runs can occur'],
      ])
      expect(infoSpy.mock.calls).toEqual([['Running upgrade "1"...'], ['...upgrade "1" complete']])
      expect(addAttemptSpy.mock.calls).toEqual([
        [
          {
            version: 1,
            time: start,
          },
        ],
      ])
      expect(addUpgradeSpy.mock.calls).toEqual([
        [
          {
            version: 1,
            start,
            end,
          },
        ],
      ])
      expect(dateSpy.mock.calls).toEqual([[], []])
      expect(sleepSpy.mock.calls).toEqual([[DbUpgrader.LOCK_REFRESH_SECONDS], [DbUpgrader.LOCK_REFRESH_SECONDS]])
      expect(updateLockSpy.mock.calls).toEqual([[]])
      expect(upgrade.mock.calls).toEqual([[]])
    })
    it('runs single upgrade if one to run and one run before', async () => {
      const debugSpy = jest.fn().mockImplementation()
      const infoSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          debug: debugSpy,
          info: infoSpy,
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      jest.spyOn(UpgradeStore, 'getCurrentVersion').mockResolvedValue(1)
      jest.spyOn(UpgradeStore, 'deleteLock').mockImplementation()
      const addAttemptSpy = jest.spyOn(UpgradeStore, 'addAttempt').mockImplementation()
      const addUpgradeSpy = jest.spyOn(UpgradeStore, 'addUpgrade').mockImplementation()
      const updateLockSpy = jest.spyOn(UpgradeStore, 'updateLock').mockImplementation()
      const sleep = require('../../src/util/sleep') // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const sleepSpy = jest.spyOn(sleep, 'default').mockImplementation()
      const DbUpgrader = require('../../src/database/db-upgrader').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const upgrade1 = jest.fn().mockImplementation()
      const upgrade2 = jest.fn().mockImplementation()
      jest.spyOn(DbUpgrader, 'getUpgrades').mockReturnValue([upgrade1, upgrade2]) // eslint-disable-line @typescript-eslint/no-empty-function
      jest.spyOn(DbUpgrader, 'aquireLock').mockImplementation()
      const start = new Date()
      const end = new Date(start.getTime() + 1000)
      const dateSpy = jest.spyOn(global, 'Date').mockReturnValueOnce(start).mockReturnValueOnce(end)

      await expect(DbUpgrader.run()).resolves.toEqual(undefined)

      expect(debugSpy.mock.calls).toEqual([
        ['Setting running to true to prevent concurrent upgrade runs'],
        ['Current version: "1"'],
        ['allUpgrades has "2" upgrades'],
        ['Found "1" new upgrade(s) to run'],
        [`sleeping: "${DbUpgrader.LOCK_REFRESH_SECONDS}" second(s) before updating lock timeout`],
        ['finished: "false"'],
        ['Updating lock timeout'],
        [`sleeping: "${DbUpgrader.LOCK_REFRESH_SECONDS}" second(s) before updating lock timeout`],
        ['setting finished to true'],
        ['finished: "true"'],
        ['Deleting lock'],
        ['Setting running to false so other upgrade runs can occur'],
      ])
      expect(infoSpy.mock.calls).toEqual([['Running upgrade "2"...'], ['...upgrade "2" complete']])
      expect(addAttemptSpy.mock.calls).toEqual([
        [
          {
            version: 2,
            time: start,
          },
        ],
      ])
      expect(addUpgradeSpy.mock.calls).toEqual([
        [
          {
            version: 2,
            start,
            end,
          },
        ],
      ])
      expect(dateSpy.mock.calls).toEqual([[], []])
      expect(sleepSpy.mock.calls).toEqual([[DbUpgrader.LOCK_REFRESH_SECONDS], [DbUpgrader.LOCK_REFRESH_SECONDS]])
      expect(updateLockSpy.mock.calls).toEqual([[]])
      expect(upgrade1.mock.calls).toEqual([])
      expect(upgrade2.mock.calls).toEqual([[]])
    })
    it('throws error if upgrade throws error', async () => {
      const debugSpy = jest.fn().mockImplementation()
      const infoSpy = jest.fn().mockImplementation()
      const errorSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          debug: debugSpy,
          info: infoSpy,
          error: errorSpy,
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      jest.spyOn(UpgradeStore, 'getCurrentVersion').mockResolvedValue(0)
      jest.spyOn(UpgradeStore, 'deleteLock').mockImplementation()
      const addAttemptSpy = jest.spyOn(UpgradeStore, 'addAttempt').mockImplementation()
      const addUpgradeSpy = jest.spyOn(UpgradeStore, 'addUpgrade').mockImplementation()
      const updateLockSpy = jest.spyOn(UpgradeStore, 'updateLock').mockImplementation()
      const sleep = require('../../src/util/sleep') // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const sleepSpy = jest.spyOn(sleep, 'default').mockImplementation()
      const DbUpgrader = require('../../src/database/db-upgrader').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const error = Error('bad upgrade')
      const upgrade = jest.fn().mockRejectedValue(error)
      jest.spyOn(DbUpgrader, 'getUpgrades').mockReturnValue([upgrade]) // eslint-disable-line @typescript-eslint/no-empty-function
      jest.spyOn(DbUpgrader, 'aquireLock').mockImplementation()
      const start = new Date()
      const end = new Date(start.getTime() + 1000)
      const dateSpy = jest.spyOn(global, 'Date').mockReturnValueOnce(start).mockReturnValueOnce(end)

      await expect(DbUpgrader.run()).rejects.toThrow(error)

      expect(debugSpy.mock.calls).toEqual([
        ['Setting running to true to prevent concurrent upgrade runs'],
        ['Current version: "0"'],
        ['allUpgrades has "1" upgrades'],
        ['Found "1" new upgrade(s) to run'],
        [`sleeping: "${DbUpgrader.LOCK_REFRESH_SECONDS}" second(s) before updating lock timeout`],
        ['finished: "false"'],
        ['Updating lock timeout'],
        ['setting finished to true'],
        ['Deleting lock'],
        ['Setting running to false so other upgrade runs can occur'],
      ])
      expect(infoSpy.mock.calls).toEqual([['Running upgrade "1"...']])
      expect(errorSpy.mock.calls).toEqual([[`Error while running upgrade "1": "${error}"`]])
      expect(addAttemptSpy.mock.calls).toEqual([
        [
          {
            version: 1,
            time: start,
          },
        ],
      ])
      expect(addUpgradeSpy.mock.calls).toEqual([])
      expect(dateSpy.mock.calls).toEqual([[]])
      expect(sleepSpy.mock.calls).toEqual([[DbUpgrader.LOCK_REFRESH_SECONDS]])
      expect(updateLockSpy.mock.calls).toEqual([[]])
      expect(upgrade.mock.calls).toEqual([[]])
    })
    it('throws error if lock update throws error', async () => {
      const debugSpy = jest.fn().mockImplementation()
      const infoSpy = jest.fn().mockImplementation()
      const errorSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          debug: debugSpy,
          info: infoSpy,
          error: errorSpy,
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      jest.spyOn(UpgradeStore, 'getCurrentVersion').mockResolvedValue(0)
      jest.spyOn(UpgradeStore, 'deleteLock').mockImplementation()
      const addAttemptSpy = jest.spyOn(UpgradeStore, 'addAttempt').mockImplementation()
      const addUpgradeSpy = jest.spyOn(UpgradeStore, 'addUpgrade').mockImplementation()
      const error = Error('document does not exist')
      const updateLockSpy = jest.spyOn(UpgradeStore, 'updateLock').mockRejectedValue(error)
      const sleep = require('../../src/util/sleep') // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const sleepSpy = jest.spyOn(sleep, 'default').mockImplementation()
      const DbUpgrader = require('../../src/database/db-upgrader').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const upgrade1 = jest.fn().mockImplementation()
      const upgrade2 = jest.fn().mockImplementation()
      const upgrade3 = jest.fn().mockImplementation()
      jest.spyOn(DbUpgrader, 'getUpgrades').mockReturnValue([upgrade1, upgrade2, upgrade3]) // eslint-disable-line @typescript-eslint/no-empty-function
      jest.spyOn(DbUpgrader, 'aquireLock').mockImplementation()
      const start = new Date()
      const end = new Date(start.getTime() + 1000)
      const dateSpy = jest.spyOn(global, 'Date').mockReturnValueOnce(start).mockReturnValueOnce(end)

      await expect(DbUpgrader.run()).rejects.toThrow(error)

      expect(debugSpy.mock.calls).toEqual([
        ['Setting running to true to prevent concurrent upgrade runs'],
        ['Current version: "0"'],
        ['allUpgrades has "3" upgrades'],
        ['Found "3" new upgrade(s) to run'],
        [`sleeping: "${DbUpgrader.LOCK_REFRESH_SECONDS}" second(s) before updating lock timeout`],
        ['finished: "false"'],
        ['Updating lock timeout'],
        ['setting finished to true due to lock update error'],
        ['setting finished to true'],
        ['Deleting lock'],
        ['Setting running to false so other upgrade runs can occur'],
      ])
      expect(infoSpy.mock.calls).toEqual([['Running upgrade "1"...'], ['...upgrade "1" complete']])
      expect(errorSpy.mock.calls).toEqual([[`Error while waiting and updating lock: "${error}"`]])
      expect(addAttemptSpy.mock.calls).toEqual([
        [
          {
            version: 1,
            time: start,
          },
        ],
      ])
      expect(addUpgradeSpy.mock.calls).toEqual([
        [
          {
            version: 1,
            start,
            end,
          },
        ],
      ])
      expect(dateSpy.mock.calls).toEqual([[], []])
      expect(sleepSpy.mock.calls).toEqual([[DbUpgrader.LOCK_REFRESH_SECONDS]])
      expect(updateLockSpy.mock.calls).toEqual([[]])
      expect(upgrade1.mock.calls).toEqual([[]])
      expect(upgrade2.mock.calls).toEqual([])
      expect(upgrade3.mock.calls).toEqual([])
    })
  })
  describe('aquireLock', () => {
    it('aquires lock if addLock succeeds on firsty try', async () => {
      const traceSpy = jest.fn().mockImplementation()
      const debugSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          debug: debugSpy,
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(false),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const lock = {
        _id: new ObjectId(),
        updated: new Date(),
      }
      const addLockSpy = jest.spyOn(UpgradeStore, 'addLock').mockResolvedValue(lock)
      const DbUpgrader = require('../../src/database/db-upgrader').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      jest.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(1000).mockReturnValueOnce(1000)

      await expect(DbUpgrader.aquireLock()).resolves.toEqual(undefined)

      expect(addLockSpy.mock.calls).toEqual([[]])
      expect(debugSpy.mock.calls).toEqual([
        [`Attempting for "${DbUpgrader.LOCK_TIMEOUT_SECONDS}" seconds to aquire lock`],
        [`Attempt "1" to aquire lock`],
        [`Lock aquired in "1" second(s)`],
      ])
      expect(traceSpy.mock.calls).toEqual([['aquired: "true"'], ['sleepBeforeNextTry: "true"']])
    })
    it('aquires lock if expired lock exists', async () => {
      const traceSpy = jest.fn().mockImplementation()
      const debugSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          debug: debugSpy,
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(false),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const start = Date.now()
      const lock = {
        _id: new ObjectId(),
        updated: new Date(),
      }
      const error = new MongoError('MongoError')
      jest.spyOn(UpgradeStore, 'isMongoError').mockReturnValue(true)
      const addLockSpy = jest.spyOn(UpgradeStore, 'addLock').mockRejectedValueOnce(error).mockResolvedValue(lock)
      const deleteLockSpy = jest.spyOn(UpgradeStore, 'deleteLock').mockImplementation()
      const DbUpgrader = require('../../src/database/db-upgrader').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const getLockSpy = jest.spyOn(UpgradeStore, 'getLock').mockResolvedValue({
        updated: new Date(start - DbUpgrader.LOCK_TIMEOUT_SECONDS * 1000 * 2),
      })
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(start) // start
        .mockReturnValueOnce(start + 1000) // loop check 1
        .mockReturnValueOnce(start + 1000) // expire check 1
        .mockReturnValueOnce(start + 2000) // loop check 2
        .mockReturnValueOnce(start + 2000) // duration

      await expect(DbUpgrader.aquireLock()).resolves.toEqual(undefined)

      expect(debugSpy.mock.calls).toEqual([
        [`Attempting for "${DbUpgrader.LOCK_TIMEOUT_SECONDS}" seconds to aquire lock`],
        [`Attempt "1" to aquire lock`],
        ['Lock already exists, checking if expired'],
        [`Greater than "${DbUpgrader.LOCK_TIMEOUT_SECONDS}" seconds since lock last updated, deleting expired lock`],
        ['Expired lock deleted'],
        [`Attempt "2" to aquire lock`],
        [`Lock aquired in "2" second(s)`],
      ])
      expect(addLockSpy.mock.calls).toEqual([[], []])
      expect(deleteLockSpy.mock.calls).toEqual([[]])
      expect(getLockSpy.mock.calls).toEqual([[]])
    })
    it('aquires lock if previous lock expires before LOCK_TIMEOUT_SECONDS', async () => {
      const traceSpy = jest.fn().mockImplementation()
      const debugSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          debug: debugSpy,
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(false),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const start = Date.now()
      const lock = {
        _id: new ObjectId(),
        updated: new Date(),
      }
      const error = new MongoError('MongoError')
      jest.spyOn(UpgradeStore, 'isMongoError').mockReturnValue(true)
      const addLockSpy = jest.spyOn(UpgradeStore, 'addLock').mockRejectedValueOnce(error).mockResolvedValue(lock)
      const deleteLockSpy = jest.spyOn(UpgradeStore, 'deleteLock').mockImplementation()
      const sleep = require('../../src/util/sleep') // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const sleepSpy = jest.spyOn(sleep, 'default').mockImplementation()
      const DbUpgrader = require('../../src/database/db-upgrader').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const getLockSpy = jest
        .spyOn(UpgradeStore, 'getLock')
        .mockResolvedValueOnce({
          updated: new Date(start + DbUpgrader.LOCK_TIMEOUT_SECONDS * 1000 - 1),
        })
        .mockResolvedValueOnce({
          updated: new Date(start + DbUpgrader.LOCK_TIMEOUT_SECONDS * 1000 * 2),
        })
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(start) // start
        .mockReturnValueOnce(start + 1000) // loop check 1
        .mockReturnValueOnce(start + 1000) // expire check 1
        .mockReturnValueOnce(start + 2000) // sleep 1
        .mockReturnValueOnce(start + 3000) // loop check 2
        .mockReturnValueOnce(start + 3000) // duration

      await expect(DbUpgrader.aquireLock()).resolves.toEqual(undefined)

      expect(debugSpy.mock.calls).toEqual([
        [`Attempting for "${DbUpgrader.LOCK_TIMEOUT_SECONDS}" seconds to aquire lock`],
        [`Attempt "1" to aquire lock`],
        ['Lock already exists, checking if expired'],
        ['Lock not expired, previous lock still running'],
        [`Lock not aquired after "2" second(s), sleeping for "${DbUpgrader.LOCK_REFRESH_SECONDS}" second(s)`],
        [`Attempt "2" to aquire lock`],
        [`Lock aquired in "3" second(s)`],
      ])
      expect(addLockSpy.mock.calls).toEqual([[], []])
      expect(deleteLockSpy.mock.calls).toEqual([])
      expect(getLockSpy.mock.calls).toEqual([[]])
      expect(sleepSpy.mock.calls).toEqual([[1]])
    })
    it('throws error if adding lock throws error that is not duplicate key error', async () => {
      const error = 'connection timed out'
      const traceSpy = jest.fn().mockImplementation()
      const debugSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          debug: debugSpy,
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(false),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const addLockSpy = jest.spyOn(UpgradeStore, 'addLock').mockRejectedValue(Error(error))
      const DbUpgrader = require('../../src/database/db-upgrader').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      jest.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(1000).mockReturnValueOnce(1000)

      await expect(DbUpgrader.aquireLock()).rejects.toThrow(error)

      expect(addLockSpy.mock.calls).toEqual([[]])
      expect(debugSpy.mock.calls).toEqual([
        [`Attempting for "${DbUpgrader.LOCK_TIMEOUT_SECONDS}" seconds to aquire lock`],
        [`Attempt "1" to aquire lock`],
      ])
      expect(traceSpy.mock.calls).toEqual([])
    })
    it('throws error if previous lock does not expire before LOCK_TIMEOUT_SECONDS', async () => {
      const traceSpy = jest.fn().mockImplementation()
      const debugSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          debug: debugSpy,
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(false),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const start = Date.now()
      const error = new MongoError('MongoError')
      jest.spyOn(UpgradeStore, 'isMongoError').mockReturnValue(true)
      const addLockSpy = jest.spyOn(UpgradeStore, 'addLock').mockRejectedValueOnce(error)
      const deleteLockSpy = jest.spyOn(UpgradeStore, 'deleteLock').mockImplementation()
      const sleep = require('../../src/util/sleep') // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const sleepSpy = jest.spyOn(sleep, 'default').mockImplementation()
      const DbUpgrader = require('../../src/database/db-upgrader').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const getLockSpy = jest.spyOn(UpgradeStore, 'getLock').mockResolvedValue({
        updated: new Date(start + DbUpgrader.LOCK_TIMEOUT_SECONDS * 1000 - 1),
      })
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(start) // start
        .mockReturnValueOnce(start + 1000) // loop check 1
        .mockReturnValueOnce(start + 1000) // expire check 1
        .mockReturnValueOnce(start + 2000) // sleep 1
        .mockReturnValueOnce(start + DbUpgrader.LOCK_TIMEOUT_SECONDS * 1000 * 2) // loop check 2
        .mockReturnValueOnce(start + DbUpgrader.LOCK_TIMEOUT_SECONDS * 1000 * 2) // duration

      await expect(DbUpgrader.aquireLock()).rejects.toThrow('Could not aquire lock after "60" seconds')

      expect(debugSpy.mock.calls).toEqual([
        [`Attempting for "${DbUpgrader.LOCK_TIMEOUT_SECONDS}" seconds to aquire lock`],
        [`Attempt "1" to aquire lock`],
        ['Lock already exists, checking if expired'],
        ['Lock not expired, previous lock still running'],
        [`Lock not aquired after "2" second(s), sleeping for "${DbUpgrader.LOCK_REFRESH_SECONDS}" second(s)`],
      ])
      expect(addLockSpy.mock.calls).toEqual([[]])
      expect(deleteLockSpy.mock.calls).toEqual([])
      expect(getLockSpy.mock.calls).toEqual([[]])
      expect(sleepSpy.mock.calls).toEqual([[DbUpgrader.LOCK_REFRESH_SECONDS]])
    })
    it('logs out if trace log enabled', async () => {
      const traceSpy = jest.fn().mockImplementation()
      const debugSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          debug: debugSpy,
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(true),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const start = Date.now()
      const lock = {
        _id: new ObjectId(),
        updated: new Date(),
      }
      const error = new MongoError('MongoError')
      jest.spyOn(UpgradeStore, 'isMongoError').mockReturnValue(true)
      const addLockSpy = jest.spyOn(UpgradeStore, 'addLock').mockRejectedValueOnce(error).mockResolvedValue(lock)
      const deleteLockSpy = jest.spyOn(UpgradeStore, 'deleteLock').mockImplementation()
      const sleep = require('../../src/util/sleep') // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const sleepSpy = jest.spyOn(sleep, 'default').mockImplementation()
      const DbUpgrader = require('../../src/database/db-upgrader').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const getLock1 = {
        updated: new Date(start + DbUpgrader.LOCK_TIMEOUT_SECONDS * 1000 - 1),
      }
      const getLock2 = {
        updated: new Date(start + DbUpgrader.LOCK_TIMEOUT_SECONDS * 1000 * 2),
      }
      const getLockSpy = jest
        .spyOn(UpgradeStore, 'getLock')
        .mockResolvedValueOnce(getLock1)
        .mockResolvedValueOnce(getLock2)
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(start) // start
        .mockReturnValueOnce(start + 1000) // loop check 1
        .mockReturnValueOnce(start + 1000) // expire check 1
        .mockReturnValueOnce(start + 2000) // sleep 1
        .mockReturnValueOnce(start + 3000) // loop check 2
        .mockReturnValueOnce(start + 3000) // duration

      await expect(DbUpgrader.aquireLock()).resolves.toEqual(undefined)

      expect(debugSpy.mock.calls).toEqual([
        [`Attempting for "${DbUpgrader.LOCK_TIMEOUT_SECONDS}" seconds to aquire lock`],
        [`Attempt "1" to aquire lock`],
        ['Lock already exists, checking if expired'],
        ['Lock not expired, previous lock still running'],
        [`Lock not aquired after "2" second(s), sleeping for "${DbUpgrader.LOCK_REFRESH_SECONDS}" second(s)`],
        [`Attempt "2" to aquire lock`],
        [`Lock aquired in "3" second(s)`],
      ])
      expect(traceSpy.mock.calls).toEqual([
        [
          `err: "${JSON.stringify({
            code: error.code,
          })}"`,
        ],
        [`potentiallyExpiredLock: "${JSON.stringify(getLock1)}"`],
        ['secondsSinceLastUpdate: "-28.999"'],
        ['aquired: "false"'],
        ['sleepBeforeNextTry: "true"'],
        [`initialLock: "${JSON.stringify(lock)}"`],
        ['aquired: "true"'],
        ['sleepBeforeNextTry: "true"'],
      ])
      expect(addLockSpy.mock.calls).toEqual([[], []])
      expect(deleteLockSpy.mock.calls).toEqual([])
      expect(getLockSpy.mock.calls).toEqual([[]])
      expect(sleepSpy.mock.calls).toEqual([[DbUpgrader.LOCK_REFRESH_SECONDS]])
    })
    it('failure to delete expired lock does not prevent aquisition', async () => {
      const traceSpy = jest.fn().mockImplementation()
      const debugSpy = jest.fn().mockImplementation()
      const errorSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          debug: debugSpy,
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(false),
          error: errorSpy,
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const start = Date.now()
      const lock = {
        _id: new ObjectId(),
        updated: new Date(),
      }
      const error = new MongoError('MongoError')
      jest.spyOn(UpgradeStore, 'isMongoError').mockReturnValue(true)
      const addLockSpy = jest.spyOn(UpgradeStore, 'addLock').mockRejectedValueOnce(error).mockResolvedValue(lock)
      const deleteError = Error()
      deleteError.message = 'does not exist'
      const deleteLockSpy = jest.spyOn(UpgradeStore, 'deleteLock').mockRejectedValue(deleteError)
      const sleep = require('../../src/util/sleep') // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const sleepSpy = jest.spyOn(sleep, 'default').mockImplementation()
      const DbUpgrader = require('../../src/database/db-upgrader').default // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
      const getLockSpy = jest.spyOn(UpgradeStore, 'getLock').mockResolvedValue({
        updated: new Date(start - DbUpgrader.LOCK_TIMEOUT_SECONDS * 1000 * 2),
      })
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(start) // start
        .mockReturnValueOnce(start + 1000) // loop check 1
        .mockReturnValueOnce(start + 1000) // expire check 1
        .mockReturnValueOnce(start + 1000) // sleep 1
        .mockReturnValueOnce(start + 2000) // loop check 2
        .mockReturnValueOnce(start + 2000) // duration

      await expect(DbUpgrader.aquireLock()).resolves.toEqual(undefined)

      expect(debugSpy.mock.calls).toEqual([
        [`Attempting for "${DbUpgrader.LOCK_TIMEOUT_SECONDS}" seconds to aquire lock`],
        [`Attempt "1" to aquire lock`],
        ['Lock already exists, checking if expired'],
        [`Greater than "${DbUpgrader.LOCK_TIMEOUT_SECONDS}" seconds since lock last updated, deleting expired lock`],
        [`Lock not aquired after "1" second(s), sleeping for "${DbUpgrader.LOCK_REFRESH_SECONDS}" second(s)`],
        [`Attempt "2" to aquire lock`],
        [`Lock aquired in "2" second(s)`],
      ])
      expect(errorSpy.mock.calls).toEqual([
        [`Could not delete expired database lock: "${JSON.stringify(deleteError)}"`],
      ])
      expect(addLockSpy.mock.calls).toEqual([[], []])
      expect(deleteLockSpy.mock.calls).toEqual([[]])
      expect(getLockSpy.mock.calls).toEqual([[]])
      expect(sleepSpy.mock.calls).toEqual([[DbUpgrader.LOCK_REFRESH_SECONDS]])
    })
  })
})
