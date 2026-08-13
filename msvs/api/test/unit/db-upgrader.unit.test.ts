import { MongoError, ObjectId } from 'mongodb'

import DbUpgrader from '../../src/database/db-upgrader'
import Upgrade from '../../src/database/upgrades/upgrade'
import UpgradeStore from '../../src/database/stores/upgrade-store'
import * as utils from '@gwent-oss/utils'

describe('db-upgrader', () => {
  describe('constructor', () => {
    it('calling without parameters uses default values', () => {
      const upgrader = new DbUpgrader({})
      expect(upgrader['lockTimeoutSeconds']).toEqual(30)
      expect(upgrader['lockRefreshSeconds']).toEqual(1)
      expect(upgrader['finished']).toEqual(false)
    })
    it('calling with parameters overrides default values', () => {
      const upgrader = new DbUpgrader({
        lockTimeoutSeconds: 10,
        lockRefreshSeconds: 0.5,
      })
      expect(upgrader['lockTimeoutSeconds']).toEqual(10)
      expect(upgrader['lockRefreshSeconds']).toEqual(0.5)
      expect(upgrader['finished']).toEqual(false)
    })
  })
  describe('run', () => {
    it('throws error if running is true', async () => {
      await testRun({
        running: true,
        error: 'Other upgrades currently running',
        dateCalls: [],
        aquireLockCalls: [],
        currentVersionCalls: [],
        deleteLockCalls: [],
      })
    })
    it('throws error and sets running to false if aquireLock throws error', async () => {
      const date = new Date()
      const error = 'connection refused'
      await testRun({
        dateResponse: date,
        aquireLockError: error,
        error: error,
        currentVersionCalls: [],
        deleteLockCalls: [],
        debugCalls: [
          ['Setting running to true to prevent concurrent upgrade runs'],
          ['Setting running to false so other upgrade runs can occur'],
        ],
      })
    })
    it('does not run upgrades if current version is 0 and no upgrades', async () => {
      const date = new Date()
      const currentVersion = 0
      const upgrades: Upgrade[] = []
      await testRun({
        dateResponse: date,
        currentVersion,
        upgrades,
        debugCalls: [
          ['Setting running to true to prevent concurrent upgrade runs'],
          ['Current version: "0"'],
          ['Upgrades length: "0"'],
          ['No new upgrades to run'],
          ['Deleting lock'],
          ['Setting running to false so other upgrade runs can occur'],
        ],
      })
    })
    it('does not run upgrades if current version is 1 and single upgrade', async () => {
      const date = new Date()
      const currentVersion = 1
      const upgrades = [new TestUpgrade()]
      await testRun({
        dateResponse: date,
        currentVersion,
        upgrades,
        debugCalls: [
          ['Setting running to true to prevent concurrent upgrade runs'],
          ['Current version: "1"'],
          ['Upgrades length: "1"'],
          ['No new upgrades to run'],
          ['Deleting lock'],
          ['Setting running to false so other upgrade runs can occur'],
        ],
      })
    })
    it('throws error and sets running to false if execute throws error', async () => {
      const date = new Date()
      const currentVersion = 0
      const upgrades = [new TestUpgrade()]
      const error = 'bad'
      await testRun({
        dateResponse: date,
        currentVersion,
        upgrades,
        executeResponse: new Promise((resolve, reject) => {
          reject(Error(error))
        }),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        keepLockUpdated: new Promise((resolve, reject) => {
          setTimeout(resolve, 10)
        }),
        executeCalls: [
          [
            {
              current: 0,
              upgrades,
              started: date,
            },
          ],
        ],
        keepLockUpdatedCalls: [[date]],
        error,
        debugCalls: [
          ['Setting running to true to prevent concurrent upgrade runs'],
          ['Current version: "0"'],
          ['Upgrades length: "1"'],
          ['Found "1" new upgrade(s) to run'],
          ['Deleting lock'],
          ['Setting running to false so other upgrade runs can occur'],
        ],
      })
    })
    it('throws error and sets running to false if keepLockUpdated throws error', async () => {
      const date = new Date()
      const currentVersion = 0
      const upgrades = [new TestUpgrade()]
      const error = 'bad'
      await testRun({
        dateResponse: date,
        currentVersion,
        upgrades,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        executeResponse: new Promise((resolve, reject) => {
          setTimeout(resolve, 10)
        }),
        keepLockUpdated: new Promise((resolve, reject) => {
          reject(Error(error))
        }),
        executeCalls: [
          [
            {
              current: 0,
              upgrades,
              started: date,
            },
          ],
        ],
        keepLockUpdatedCalls: [[date]],
        error,
        debugCalls: [
          ['Setting running to true to prevent concurrent upgrade runs'],
          ['Current version: "0"'],
          ['Upgrades length: "1"'],
          ['Found "1" new upgrade(s) to run'],
          ['Deleting lock'],
          ['Setting running to false so other upgrade runs can occur'],
        ],
      })
    })
    it('runs upgrades where execute finishes before keepLockUpdated', async () => {
      const date = new Date()
      const currentVersion = 0
      const upgrades = [new TestUpgrade()]
      await testRun({
        dateResponse: date,
        currentVersion,
        upgrades,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        executeResponse: new Promise((resolve, reject) => {
          resolve('')
        }),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        keepLockUpdated: new Promise((resolve, reject) => {
          setTimeout(resolve, 10)
        }),
        executeCalls: [
          [
            {
              current: 0,
              upgrades,
              started: date,
            },
          ],
        ],
        keepLockUpdatedCalls: [[date]],
        debugCalls: [
          ['Setting running to true to prevent concurrent upgrade runs'],
          ['Current version: "0"'],
          ['Upgrades length: "1"'],
          ['Found "1" new upgrade(s) to run'],
          ['Deleting lock'],
          ['Setting running to false so other upgrade runs can occur'],
        ],
      })
    })
    it('runs upgrades where execute finishes after keepLockUpdated', async () => {
      const date = new Date()
      const currentVersion = 0
      const upgrades = [new TestUpgrade()]
      await testRun({
        dateResponse: date,
        currentVersion,
        upgrades,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        executeResponse: new Promise((resolve, reject) => {
          setTimeout(resolve, 10)
        }),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        keepLockUpdated: new Promise((resolve, reject) => {
          resolve('')
        }),
        executeCalls: [
          [
            {
              current: 0,
              upgrades,
              started: date,
            },
          ],
        ],
        keepLockUpdatedCalls: [[date]],
        debugCalls: [
          ['Setting running to true to prevent concurrent upgrade runs'],
          ['Current version: "0"'],
          ['Upgrades length: "1"'],
          ['Found "1" new upgrade(s) to run'],
          ['Deleting lock'],
          ['Setting running to false so other upgrade runs can occur'],
        ],
      })
    })
  })
  describe('aquireLock', () => {
    it('aquires lock if addLock succeeds on firsty try', async () => {
      const start = Date.now()
      await testAquireLock({
        dates: [
          start,
          start + 1000, // loop check 1
          start + 1000, // duration
        ],
        addLockResponses: [
          () =>
            Promise.resolve({
              _id: UpgradeStore['LOCK_ID'],
              updated: new Date(),
            }),
        ],
        debugCalls: [
          [`Attempting for "30" seconds to aquire lock`],
          [`Attempt "1" to aquire lock`],
          [`Lock aquired in "1" second(s)`],
        ],
        traceCalls: [['aquired: "true"'], ['sleepBeforeNextTry: "true"']],
      })
    })
    it('aquires lock if expired lock exists', async () => {
      const start = Date.now()
      const expired = new Date(start - 30 * 1000 * 2)
      const error = new MongoError('duplicate key')
      await testAquireLock({
        dates: [
          start,
          start + 1000, // loop check 1
          start + 1000, // expire check 1
          start + 2000, // loop check 2
          start + 2000, // duration
        ],
        addLockResponses: [
          () => Promise.reject(error),
          () =>
            Promise.resolve({
              _id: UpgradeStore['LOCK_ID'],
              updated: new Date(),
            }),
        ],
        getLockResponses: [
          () =>
            Promise.resolve({
              _id: UpgradeStore['LOCK_ID'],
              updated: expired,
            }),
        ],
        isMongoErrorResponses: [true],
        isMongoErrorCalls: [
          [
            {
              error: error,
              code: 11000,
            },
          ],
        ],
        deleteLockResponses: [() => Promise.resolve()],
        debugCalls: [
          [`Attempting for "30" seconds to aquire lock`],
          [`Attempt "1" to aquire lock`],
          ['Lock already exists, checking if expired'],
          [`Greater than "30" seconds since lock last updated, deleting expired lock`],
          ['Expired lock deleted'],
          [`Attempt "2" to aquire lock`],
          [`Lock aquired in "2" second(s)`],
        ],
        traceCalls: [
          ['secondsSinceLastUpdate: "61"'],
          ['aquired: "false"'],
          ['sleepBeforeNextTry: "false"'],
          ['aquired: "true"'],
          ['sleepBeforeNextTry: "false"'],
        ],
      })
    })
    it('aquires lock if previous lock expires before lockTimeoutSeconds', async () => {
      const start = Date.now()
      const error = new MongoError('duplicate key')
      await testAquireLock({
        dates: [
          start,
          start + 1000, // loop check 1
          start + 1000, // expire check 1
          start + 2000, // sleep 1
          start + 3000, // loop check 2
          start + 3000, // duration
        ],
        addLockResponses: [
          () => Promise.reject(error),
          () =>
            Promise.resolve({
              _id: UpgradeStore['LOCK_ID'],
              updated: new Date(),
            }),
        ],
        getLockResponses: [
          () =>
            Promise.resolve({
              _id: UpgradeStore['LOCK_ID'],
              updated: new Date(start + 30 * 1000),
            }),
        ],
        isMongoErrorResponses: [true],
        isMongoErrorCalls: [
          [
            {
              error: error,
              code: 11000,
            },
          ],
        ],
        sleepCalls: [[1]],
        debugCalls: [
          [`Attempting for "30" seconds to aquire lock`],
          [`Attempt "1" to aquire lock`],
          ['Lock already exists, checking if expired'],
          ['Lock not expired, previous lock still running'],
          [`Lock not aquired after "2" second(s), sleeping for "1" second(s)`],
          [`Attempt "2" to aquire lock`],
          [`Lock aquired in "3" second(s)`],
        ],
        traceCalls: [
          ['secondsSinceLastUpdate: "-29"'],
          ['aquired: "false"'],
          ['sleepBeforeNextTry: "true"'],
          ['aquired: "true"'],
          ['sleepBeforeNextTry: "true"'],
        ],
      })
    })
    it('throws error if adding lock throws error that is not duplicate key error', async () => {
      const start = Date.now()
      const error = 'connection timed out'
      await testAquireLock({
        dates: [
          start,
          start + 1000, // loop check 1
        ],
        addLockResponses: [() => Promise.reject(Error(error))],
        isMongoErrorResponses: [false],
        isMongoErrorCalls: [
          [
            {
              error: Error(error),
              code: 11000,
            },
          ],
        ],
        error,
        debugCalls: [[`Attempting for "30" seconds to aquire lock`], [`Attempt "1" to aquire lock`]],
      })
    })
    it('throws error if getting existing lock returns null', async () => {
      const start = Date.now()
      const error = 'Could not get lock which should exist'
      await testAquireLock({
        dates: [
          start,
          start + 1000, // loop check 1
        ],
        addLockResponses: [() => Promise.reject(Error(error))],
        getLockResponses: [() => Promise.resolve(null)],
        isMongoErrorResponses: [true],
        isMongoErrorCalls: [
          [
            {
              error: Error(error),
              code: 11000,
            },
          ],
        ],
        error,
        debugCalls: [
          [`Attempting for "30" seconds to aquire lock`],
          [`Attempt "1" to aquire lock`],
          ['Lock already exists, checking if expired'],
        ],
        errorCalls: [[error]],
      })
    })
    it('throws error if previous lock does not expire before LOCK_TIMEOUT_SECONDS', async () => {
      const start = Date.now()
      const error = new MongoError('duplicate key')
      await testAquireLock({
        dates: [
          start,
          start + 1000, // loop check 1
          start + 1000, // expire check 1
          start + 2000, // sleep 1
          start + 30 * 1000 * 2, // loop check 2
          start + 30 * 1000 * 2, // duration
        ],
        addLockResponses: [() => Promise.reject(error)],
        getLockResponses: [
          () =>
            Promise.resolve({
              _id: UpgradeStore['LOCK_ID'],
              updated: new Date(start + 30 * 1000 - 1),
            }),
        ],
        isMongoErrorResponses: [true],
        isMongoErrorCalls: [
          [
            {
              error: error,
              code: 11000,
            },
          ],
        ],
        sleepCalls: [[1]],
        error: 'Could not aquire lock after "60" seconds',
        debugCalls: [
          [`Attempting for "30" seconds to aquire lock`],
          [`Attempt "1" to aquire lock`],
          ['Lock already exists, checking if expired'],
          ['Lock not expired, previous lock still running'],
          [`Lock not aquired after "2" second(s), sleeping for "1" second(s)`],
        ],
        traceCalls: [['secondsSinceLastUpdate: "-28.999"'], ['aquired: "false"'], ['sleepBeforeNextTry: "true"']],
      })
    })
    it('logs to trace if enabled', async () => {
      const start = Date.now()
      const error = new MongoError('duplicate key')
      const addLockResponse = {
        _id: new ObjectId(),
        updated: new Date(),
      }
      const getLockResponse = {
        _id: UpgradeStore['LOCK_ID'],
        updated: new Date(start + 30 * 1000 - 1),
      }
      await testAquireLock({
        dates: [
          start,
          start + 1000, // loop check 1
          start + 1000, // expire check 1
          start + 2000, // sleep 1
          start + 3000, // loop check 2
          start + 3000, // duration
        ],
        addLockResponses: [() => Promise.reject(error), () => Promise.resolve(addLockResponse)],
        getLockResponses: [() => Promise.resolve(getLockResponse)],
        isMongoErrorResponses: [true],
        isMongoErrorCalls: [
          [
            {
              error: error,
              code: 11000,
            },
          ],
        ],
        sleepCalls: [[1]],
        debugCalls: [
          [`Attempting for "30" seconds to aquire lock`],
          [`Attempt "1" to aquire lock`],
          ['Lock already exists, checking if expired'],
          ['Lock not expired, previous lock still running'],
          [`Lock not aquired after "2" second(s), sleeping for "1" second(s)`],
          [`Attempt "2" to aquire lock`],
          [`Lock aquired in "3" second(s)`],
        ],
        isTraceEnabled: true,
        traceCalls: [
          [
            `err: "${JSON.stringify({
              errorLabelSet: {},
            })}"`,
          ],
          [`potentiallyExpiredLock: "${JSON.stringify(getLockResponse)}"`],
          ['secondsSinceLastUpdate: "-28.999"'],
          ['aquired: "false"'],
          ['sleepBeforeNextTry: "true"'],
          [`initialLock: "${JSON.stringify(addLockResponse)}"`],
          ['aquired: "true"'],
          ['sleepBeforeNextTry: "true"'],
        ],
      })
    })
    it('failure to delete expired lock does not prevent aquisition', async () => {
      const start = Date.now()
      const error = new MongoError('duplicate key')
      const deleteError = Error()
      deleteError.message = 'does not exist'
      await testAquireLock({
        dates: [
          start,
          start + 1000, // loop check 1
          start + 1000, // expire check 1
          start + 1000, // sleep 1
          start + 2000, // loop check 2
          start + 2000, // duration
        ],
        addLockResponses: [
          () => Promise.reject(error),
          () =>
            Promise.resolve({
              _id: UpgradeStore['LOCK_ID'],
              updated: new Date(),
            }),
        ],
        getLockResponses: [
          () =>
            Promise.resolve({
              _id: UpgradeStore['LOCK_ID'],
              updated: new Date(start - 30 * 1000 * 2),
            }),
        ],
        isMongoErrorResponses: [true],
        isMongoErrorCalls: [
          [
            {
              error: error,
              code: 11000,
            },
          ],
        ],
        deleteLockResponses: [() => Promise.reject(deleteError)],
        sleepCalls: [[1]],
        debugCalls: [
          [`Attempting for "30" seconds to aquire lock`],
          [`Attempt "1" to aquire lock`],
          ['Lock already exists, checking if expired'],
          [`Greater than "30" seconds since lock last updated, deleting expired lock`],
          [`Lock not aquired after "1" second(s), sleeping for "1" second(s)`],
          [`Attempt "2" to aquire lock`],
          [`Lock aquired in "2" second(s)`],
        ],
        traceCalls: [
          ['secondsSinceLastUpdate: "61"'],
          ['aquired: "false"'],
          ['sleepBeforeNextTry: "true"'],
          ['aquired: "true"'],
          ['sleepBeforeNextTry: "true"'],
        ],
        errorCalls: [[`Could not delete expired database lock: "${JSON.stringify(deleteError)}"`]],
      })
    })
  })
  describe('execute', () => {
    it('does not run upgrades if upgrades not larger than current', async () => {
      const started = new Date()
      await testExecute({
        current: 0,
        upgradeResponses: [],
        started,
        debugCalls: [['setting finished to true']],
      })
    })
    it('does not run upgrades if isStillRunning false', async () => {
      const started = new Date()
      await testExecute({
        current: 0,
        upgradeResponses: [undefined],
        started,
        isStillRunningResponses: [false],
        isStillRunningCalls: [[started]],
        upgradeCalls: [[]],
        debugCalls: [['setting finished to true']],
      })
    })
    it('runs single upgrade', async () => {
      const started = new Date(Date.now() - 2000)
      const start = new Date(Date.now() - 1000)
      const end = new Date()
      await testExecute({
        current: 0,
        upgradeResponses: [undefined],
        started,
        isStillRunningResponses: [true],
        dates: [start, end],
        addAttemptCalls: [
          [
            {
              version: 1,
              time: start,
            },
          ],
        ],
        upgradeCalls: [[[]]],
        isStillRunningCalls: [[started]],
        addUpgradeCalls: [
          [
            {
              version: 1,
              start,
              end,
            },
          ],
        ],
        infoCalls: [
          [`Running upgrade "1"...`],
          [`...upgrade "1" completed in "${(end.getTime() - start.getTime()) / 1000}" second(s).`],
        ],
        debugCalls: [
          ['Adding attempt for upgrade "1"'],
          ['Executing run function for upgrade "1"'],
          ['Adding completed for upgrade "1"'],
          ['setting finished to true'],
        ],
      })
    })
    it('runs multiple upgrades', async () => {
      const started = new Date(Date.now() - 4000)
      const start1 = new Date(Date.now() - 3000)
      const end1 = new Date(Date.now() - 2000)
      const start2 = new Date(Date.now() - 1000)
      const end2 = new Date()
      await testExecute({
        current: 0,
        upgradeResponses: [undefined, undefined],
        started,
        isStillRunningResponses: [true, true],
        dates: [start1, end1, start2, end2],
        addAttemptCalls: [
          [
            {
              version: 1,
              time: start1,
            },
          ],
          [
            {
              version: 2,
              time: start2,
            },
          ],
        ],
        upgradeCalls: [[[]], [[]]],
        isStillRunningCalls: [[started], [started]],
        addUpgradeCalls: [
          [
            {
              version: 1,
              start: start1,
              end: end1,
            },
          ],
          [
            {
              version: 2,
              start: start2,
              end: end2,
            },
          ],
        ],
        infoCalls: [
          [`Running upgrade "1"...`],
          [`...upgrade "1" completed in "${(end1.getTime() - start1.getTime()) / 1000}" second(s).`],
          [`Running upgrade "2"...`],
          [`...upgrade "2" completed in "${(end2.getTime() - start2.getTime()) / 1000}" second(s).`],
        ],
        debugCalls: [
          ['Adding attempt for upgrade "1"'],
          ['Executing run function for upgrade "1"'],
          ['Adding completed for upgrade "1"'],
          ['Adding attempt for upgrade "2"'],
          ['Executing run function for upgrade "2"'],
          ['Adding completed for upgrade "2"'],
          ['setting finished to true'],
        ],
      })
    })
    it('throws error for single upgrade', async () => {
      const started = new Date(Date.now() - 1000)
      const start = new Date()
      const error = Error('bad')
      await testExecute({
        current: 0,
        upgradeResponses: [error],
        started,
        isStillRunningResponses: [true],
        dates: [start],
        addAttemptCalls: [
          [
            {
              version: 1,
              time: start,
            },
          ],
        ],
        upgradeCalls: [[[]]],
        isStillRunningCalls: [[started]],
        error,
        errorCalls: [[`Upgrade "1" failed: ${error}`]],
        infoCalls: [[`Running upgrade "1"...`]],
        debugCalls: [
          ['Adding attempt for upgrade "1"'],
          ['Executing run function for upgrade "1"'],
          ['setting finished to true'],
        ],
      })
    })
    it('throws error for first of many upgrades', async () => {
      const started = new Date(Date.now() - 1000)
      const start = new Date()
      const error = Error('bad')
      await testExecute({
        current: 0,
        upgradeResponses: [error, undefined],
        started,
        isStillRunningResponses: [true, true],
        dates: [start],
        error,
        addAttemptCalls: [
          [
            {
              version: 1,
              time: start,
            },
          ],
        ],
        upgradeCalls: [[[]], []],
        isStillRunningCalls: [[started]],
        errorCalls: [[`Upgrade "1" failed: ${error}`]],
        infoCalls: [[`Running upgrade "1"...`]],
        debugCalls: [
          ['Adding attempt for upgrade "1"'],
          ['Executing run function for upgrade "1"'],
          ['setting finished to true'],
        ],
      })
    })
    it('throws error for last of many upgrades', async () => {
      const started = new Date(Date.now() - 4000)
      const start1 = new Date(Date.now() - 3000)
      const end1 = new Date(Date.now() - 2000)
      const start2 = new Date(Date.now() - 1000)
      const error = Error('bad')
      await testExecute({
        current: 0,
        upgradeResponses: [undefined, error],
        started,
        isStillRunningResponses: [true, true],
        dates: [start1, end1, start2],
        error,
        addAttemptCalls: [
          [
            {
              version: 1,
              time: start1,
            },
          ],
          [
            {
              version: 2,
              time: start2,
            },
          ],
        ],
        upgradeCalls: [[[]], [[]]],
        isStillRunningCalls: [[started], [started]],
        addUpgradeCalls: [
          [
            {
              version: 1,
              start: start1,
              end: end1,
            },
          ],
        ],
        errorCalls: [[`Upgrade "2" failed: ${error}`]],
        infoCalls: [
          [`Running upgrade "1"...`],
          [`...upgrade "1" completed in "${(end1.getTime() - start1.getTime()) / 1000}" second(s).`],
          [`Running upgrade "2"...`],
        ],
        debugCalls: [
          ['Adding attempt for upgrade "1"'],
          ['Executing run function for upgrade "1"'],
          ['Adding completed for upgrade "1"'],
          ['Adding attempt for upgrade "2"'],
          ['Executing run function for upgrade "2"'],
          ['setting finished to true'],
        ],
      })
    })
  })
  describe('keepLockUpdated', () => {
    it('does not sleep or update lock if already finished', async () => {
      const started = new Date()
      await testKeepLockUpdated({
        started,
        isStillRunningResponses: [false],
        debugCalls: [['Finished keeping lock updated']],
        traceCalls: [[`started "${started}", stillRunning: "false"`]],
      })
    })
    it('sleeps but does not update if finished after sleep', async () => {
      const started = new Date()
      await testKeepLockUpdated({
        started,
        isStillRunningResponses: [true, false],
        sleepCalls: [[1]],
        debugCalls: [[`sleeping "1" second(s) before updating lock timeout`], ['Finished keeping lock updated']],
        traceCalls: [[`started "${started}", stillRunning: "true"`], [`started "${started}", stillRunning: "false"`]],
      })
    })
    it('sleeps and updates if not finished after sleep', async () => {
      const started = new Date()
      await testKeepLockUpdated({
        started,
        isStillRunningResponses: [true, true, false],
        updateLockResponses: [undefined],
        sleepCalls: [[1]],
        updateLockCalls: [[]],
        debugCalls: [
          [`sleeping "1" second(s) before updating lock timeout`],
          ['updating lock timeout'],
          ['Finished keeping lock updated'],
        ],
        traceCalls: [
          [`started "${started}", stillRunning: "true"`],
          [`started "${started}", stillRunning: "true"`],
          [`started "${started}", stillRunning: "false"`],
        ],
      })
    })
    it('sleeps and updates and sleeps again if not finished after update', async () => {
      const started = new Date()
      await testKeepLockUpdated({
        started,
        isStillRunningResponses: [true, true, true, false],
        updateLockResponses: [undefined],
        sleepCalls: [[1], [1]],
        updateLockCalls: [[]],
        debugCalls: [
          [`sleeping "1" second(s) before updating lock timeout`],
          ['updating lock timeout'],
          [`sleeping "1" second(s) before updating lock timeout`],
          ['Finished keeping lock updated'],
        ],
        traceCalls: [
          [`started "${started}", stillRunning: "true"`],
          [`started "${started}", stillRunning: "true"`],
          [`started "${started}", stillRunning: "true"`],
          [`started "${started}", stillRunning: "false"`],
        ],
      })
    })
    it('updates through twice', async () => {
      const started = new Date()
      await testKeepLockUpdated({
        started,
        isStillRunningResponses: [true, true, true, true, false],
        updateLockResponses: [undefined, undefined],
        sleepCalls: [[1], [1]],
        updateLockCalls: [[], []],
        debugCalls: [
          [`sleeping "1" second(s) before updating lock timeout`],
          ['updating lock timeout'],
          [`sleeping "1" second(s) before updating lock timeout`],
          ['updating lock timeout'],
          ['Finished keeping lock updated'],
        ],
        traceCalls: [
          [`started "${started}", stillRunning: "true"`],
          [`started "${started}", stillRunning: "true"`],
          [`started "${started}", stillRunning: "true"`],
          [`started "${started}", stillRunning: "true"`],
          [`started "${started}", stillRunning: "false"`],
        ],
      })
    })
    it('throws error and sets finished to true if error in updateLock', async () => {
      const started = new Date()
      const error = Error('bad')
      await testKeepLockUpdated({
        started,
        isStillRunningResponses: [true, true],
        sleepCalls: [[1]],
        updateLockResponses: [error],
        error,
        updateLockCalls: [[]],
        errorCalls: [[`Error while keeping lock updated: ${error}`]],
        debugCalls: [
          [`sleeping "1" second(s) before updating lock timeout`],
          ['updating lock timeout'],
          ['setting finished to true due to lock update error'],
          ['Finished keeping lock updated'],
        ],
        traceCalls: [[`started "${started}", stillRunning: "true"`], [`started "${started}", stillRunning: "true"`]],
      })
    })
  })
  describe('isStillRunning', () => {
    it('return false if finished is true', () => {
      testIsStillRunning({
        finished: true,
        started: new Date(),
        start: new Date(),
        expected: false,
        debugCalls: [['finished is true so not still running']],
      })
    })
    it('return false if finished false and started does not equal start', () => {
      const started = new Date()
      const start = new Date(started.getTime() + 1000)
      testIsStillRunning({
        finished: false,
        started,
        start,
        expected: false,
        debugCalls: [
          [`current start time "${start}" does not match original start time "${started}" so not still running`],
        ],
      })
    })
    it('return true if finished false and started equals start', () => {
      const started = new Date()
      testIsStillRunning({
        finished: false,
        started,
        start: started,
        expected: true,
        debugCalls: [['start time matches original start time, so still running']],
      })
    })
  })
})

async function testRun({
  running = false,
  currentVersion,
  upgrades,
  error,
  dateResponse,
  dateCalls = [[]],
  aquireLockCalls = [[]],
  currentVersionCalls = [[]],
  deleteLockCalls = [[]],
  aquireLockError,
  executeResponse,
  executeCalls = [],
  keepLockUpdated,
  keepLockUpdatedCalls = [],
  errorCalls = [],
  infoCalls = [],
  debugCalls = [],
}: {
  running?: boolean
  currentVersion?: number
  upgrades?: Upgrade[]
  error?: string
  dateResponse?: Date
  dateCalls?: any[][]
  aquireLockCalls?: any[][]
  currentVersionCalls?: any[][]
  deleteLockCalls?: any[][]
  aquireLockError?: string
  executeResponse?: Promise<any>
  executeCalls?: any[][]
  keepLockUpdated?: Promise<any>
  keepLockUpdatedCalls?: any[][]
  errorCalls?: string[][]
  infoCalls?: string[][]
  debugCalls?: string[][]
}) {
  DbUpgrader['running'] = running
  const upgrader = new DbUpgrader({})
  const dateSpy = jest.spyOn(global, 'Date')
  if (dateResponse) {
    dateSpy.mockImplementation(() => dateResponse)
  }
  const aquireLockSpy = jest.spyOn(upgrader as any, 'aquireLock').mockImplementation(() => {
    return new Promise((resolve, reject) => {
      if (aquireLockError) {
        reject(Error(aquireLockError))
      } else {
        resolve(undefined)
      }
    })
  })
  const currentVersionSpy = jest.spyOn(UpgradeStore, 'getCurrentVersion').mockResolvedValue(currentVersion as any)
  const executeSpy = jest.spyOn(upgrader as any, 'execute')
  if (executeResponse) {
    executeSpy.mockImplementation(() => executeResponse)
  }
  const keepLockUpdatedSpy = jest.spyOn(upgrader as any, 'keepLockUpdated')
  if (keepLockUpdated) {
    keepLockUpdatedSpy.mockImplementation(() => keepLockUpdated)
  }
  const deleteLockSpy = jest.spyOn(UpgradeStore, 'deleteLock').mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const infoSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  DbUpgrader['logger'] = {
    error: errorSpy,
    info: infoSpy,
    debug: debugSpy,
  } as any

  const promise = upgrader.run({
    upgrades: upgrades || [],
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(undefined)
  }

  expect(dateSpy.mock.calls).toEqual(dateCalls)
  expect(aquireLockSpy.mock.calls).toEqual(aquireLockCalls)
  expect(currentVersionSpy.mock.calls).toEqual(currentVersionCalls)
  expect(executeSpy.mock.calls).toEqual(executeCalls)
  expect(keepLockUpdatedSpy.mock.calls).toEqual(keepLockUpdatedCalls)
  expect(deleteLockSpy.mock.calls).toEqual(deleteLockCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(infoSpy.mock.calls).toEqual(infoCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
}

async function testAquireLock({
  dates = [],
  addLockResponses = [],
  isMongoErrorResponses = [],
  isMongoErrorCalls = [],
  getLockResponses = [],
  deleteLockResponses = [],
  sleepCalls = [],
  error,
  debugCalls = [],
  infoCalls = [],
  errorCalls = [],
  traceCalls = [],
  isTraceEnabled = false,
}: {
  dates?: number[]
  addLockResponses?: any[]
  isMongoErrorResponses?: boolean[]
  isMongoErrorCalls?: any[][]
  getLockResponses?: any[]
  deleteLockResponses?: any[]
  sleepCalls?: any[][]
  error?: string
  debugCalls?: string[][]
  infoCalls?: string[][]
  errorCalls?: string[][]
  traceCalls?: string[][]
  isTraceEnabled?: boolean
}) {
  const upgrader = new DbUpgrader({})
  const dateSpy = jest.spyOn(Date, 'now')
  for (const date of dates) {
    dateSpy.mockImplementationOnce(() => date)
  }
  const addLockSpy = jest.spyOn(UpgradeStore, 'addLock')
  for (const addLockResponse of addLockResponses) {
    addLockSpy.mockImplementationOnce(addLockResponse)
  }
  const isMongoErrorSpy = jest.spyOn(UpgradeStore, 'isMongoError')
  for (const isMongoErrorResponse of isMongoErrorResponses) {
    isMongoErrorSpy.mockReturnValueOnce(isMongoErrorResponse)
  }
  const getLockSpy = jest.spyOn(UpgradeStore, 'getLock')
  for (const getLockResponse of getLockResponses) {
    getLockSpy.mockImplementationOnce(getLockResponse)
  }
  const deleteLockSpy = jest.spyOn(UpgradeStore, 'deleteLock')
  for (const deleteLockResponse of deleteLockResponses) {
    deleteLockSpy.mockImplementationOnce(deleteLockResponse)
  }
  const sleepSpy = jest.spyOn(utils, 'sleep').mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const infoSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  DbUpgrader['logger'] = {
    debug: debugSpy,
    info: infoSpy,
    error: errorSpy,
    isTraceEnabled: jest.fn().mockReturnValue(isTraceEnabled),
    trace: traceSpy,
  } as any

  const promise = upgrader['aquireLock']()
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(undefined)
  }

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(infoSpy.mock.calls).toEqual(infoCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
  expect(dateSpy.mock.calls).toEqual(dates.length === 0 ? [] : dates.map(() => []))
  expect(addLockSpy.mock.calls).toEqual(addLockResponses.map(() => []))
  expect(isMongoErrorSpy.mock.calls).toEqual(isMongoErrorCalls)
  expect(getLockSpy.mock.calls).toEqual(getLockResponses.map(() => []))
  expect(deleteLockSpy.mock.calls).toEqual(deleteLockResponses.map(() => []))
  expect(sleepSpy.mock.calls).toEqual(sleepCalls)
}

async function testExecute({
  current,
  upgradeResponses,
  started,
  isStillRunningResponses,
  isStillRunningCalls = [],
  dates = [],
  error,
  addAttemptCalls = [],
  addUpgradeCalls = [],
  upgradeCalls = [],
  infoCalls = [],
  debugCalls = [],
  errorCalls = [],
}: {
  current: number
  upgradeResponses: (Error | undefined)[]
  started: Date
  isStillRunningResponses?: boolean[]
  isStillRunningCalls?: any[][]
  dates?: Date[]
  error?: Error
  addAttemptCalls?: any[][]
  addUpgradeCalls?: any[][]
  upgradeCalls?: any[][]
  infoCalls?: string[][]
  debugCalls?: string[][]
  errorCalls?: string[][]
}) {
  const upgrader = new DbUpgrader({})
  const dateSpy = jest.spyOn(global, 'Date')
  for (const date of dates) {
    dateSpy.mockImplementationOnce(() => date)
  }
  const isStillRunningSpy = jest.spyOn(upgrader as any, 'isStillRunning')
  if (isStillRunningResponses) {
    for (const isStillRunningResponse of isStillRunningResponses) {
      isStillRunningSpy.mockReturnValueOnce(isStillRunningResponse)
    }
  }
  const addAttemptSpy = jest.spyOn(UpgradeStore, 'addAttempt').mockImplementation()
  const addUpgradeSpy = jest.spyOn(UpgradeStore, 'addUpgrade').mockImplementation()
  const upgrades: Upgrade[] = []
  const upgradeSpies: jest.Mock[] = []
  for (const upgradeResponse of upgradeResponses) {
    const upgradeSpy = jest.fn()
    if (upgradeResponse instanceof Error) {
      upgradeSpy.mockRejectedValue(upgradeResponse)
    } else {
      upgradeSpy.mockResolvedValue(upgradeResponse)
    }
    upgradeSpies.push(upgradeSpy)
    upgrades.push({
      run: upgradeSpy,
    })
  }
  upgrader['finished'] = false
  const infoSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  DbUpgrader['logger'] = {
    info: infoSpy,
    debug: debugSpy,
    error: errorSpy,
  } as any

  const promise = upgrader['execute']({
    current,
    upgrades,
    started,
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(undefined)
  }

  expect(upgrader['finished']).toEqual(true)
  expect(isStillRunningSpy.mock.calls).toEqual(isStillRunningCalls)
  expect(dateSpy.mock.calls).toEqual(dates.length === 0 ? [] : dates.map(() => []))
  expect(addAttemptSpy.mock.calls).toEqual(addAttemptCalls)
  expect(addUpgradeSpy.mock.calls).toEqual(addUpgradeCalls)
  expect(upgradeSpies.map((upgradeSpy) => upgradeSpy.mock.calls)).toEqual(upgradeCalls)
  expect(infoSpy.mock.calls).toEqual(infoCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}

async function testKeepLockUpdated({
  started,
  isStillRunningResponses,
  updateLockResponses,
  error,
  sleepCalls = [],
  updateLockCalls = [],
  errorCalls = [],
  debugCalls = [],
  traceCalls = [],
}: {
  started: Date
  isStillRunningResponses: boolean[]
  updateLockResponses?: (Error | undefined)[]
  error?: Error
  sleepCalls?: any[]
  updateLockCalls?: any[]
  errorCalls?: string[][]
  debugCalls?: string[][]
  traceCalls?: string[][]
}) {
  const upgrader = new DbUpgrader({})
  const isStillRunningSpy = jest.spyOn(upgrader as any, 'isStillRunning')
  for (const isStillRunningResponse of isStillRunningResponses) {
    isStillRunningSpy.mockReturnValueOnce(isStillRunningResponse)
  }
  const sleepSpy = jest.spyOn(utils, 'sleep')
  if (sleepCalls) {
    for (let i = 0; i < sleepCalls.length; i++) {
      sleepSpy.mockResolvedValueOnce()
    }
  }
  const updateLockSpy = jest.spyOn(UpgradeStore, 'updateLock')
  if (updateLockResponses) {
    for (const updateLockResponse of updateLockResponses) {
      updateLockSpy.mockImplementationOnce(
        () =>
          new Promise((resolve, reject) => {
            if (updateLockResponse instanceof Error) {
              reject(updateLockResponse)
            } else {
              resolve('' as any)
            }
          })
      )
    }
  }
  const errorSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  DbUpgrader['logger'] = {
    error: errorSpy,
    debug: debugSpy,
    trace: traceSpy,
  } as any

  const promise = upgrader['keepLockUpdated'](started)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(undefined)
  }

  expect(upgrader['finished']).toEqual(error ? true : false)
  expect(isStillRunningSpy.mock.calls).toEqual(isStillRunningResponses.map(() => [started]))
  expect(sleepSpy.mock.calls).toEqual(sleepCalls)
  expect(updateLockSpy.mock.calls).toEqual(updateLockCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}

function testIsStillRunning({
  finished,
  started,
  start,
  expected,
  debugCalls = [],
}: {
  finished: boolean
  started: Date
  start: Date
  expected: boolean
  debugCalls?: any[][]
}) {
  const upgrader = new DbUpgrader({})
  upgrader['finished'] = finished
  upgrader['start'] = start
  const debugSpy = jest.fn().mockImplementation()
  DbUpgrader['logger'] = {
    debug: debugSpy,
  } as any

  expect(upgrader['isStillRunning'](started)).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
}

class TestUpgrade extends Upgrade {
  async run() {
    await Promise.resolve()
  }
}
