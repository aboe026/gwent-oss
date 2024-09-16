import fs from 'fs-extra'
import { MongoError, ObjectId } from 'mongodb'
import path from 'path'

import DbUpgrader from '../../src/database/db-upgrader'
import Upgrade from '../../src/database/upgrades/upgrade'
import UpgradeStore from '../../src/database/stores/upgrade-store'
import * as utils from '@gwent/utils'

describe('db-upgrader', () => {
  describe('getUpgrades', () => {
    it('returns the same length as there are upgrade scripts', async () => {
      const upgradeFiles = await fs.readdir(path.join(__dirname, '../../src/database/upgrades'))
      const upgradeScripts = upgradeFiles.filter((upgradeFile) => upgradeFile.match(/^upgrade-\d+\.ts$/))

      expect(DbUpgrader['getUpgrades']()).toHaveLength(upgradeScripts.length)
    })
  })
  describe('run', () => {
    it('throws error if running is true', async () => {
      await testDbUpgrader({
        running: true,
        error: 'Already attempting to run an upgrade',
        aquireLockCalls: [],
        currentVersionCalls: [],
        getUpgradesCalls: [],
        deleteLockCalls: [],
      })
    })
    it('throws error and sets running to false if aquireLock throws error', async () => {
      const error = 'connection refused'
      await testDbUpgrader({
        aquireLockError: error,
        error: error,
        currentVersionCalls: [],
        getUpgradesCalls: [],
        deleteLockCalls: [],
        debugCalls: [
          ['Setting running to true to prevent concurrent upgrade runs'],
          ['Setting running to false so other upgrade runs can occur'],
        ],
      })
    })
    it('does not run upgrades if current version is 0 and no upgrades', async () => {
      const currentVersion = 0
      const upgrades: Upgrade[] = []
      await testDbUpgrader({
        currentVersion,
        upgrades,
        debugCalls: [
          ['Setting running to true to prevent concurrent upgrade runs'],
          ['Current version: "0"'],
          ['allUpgrades has "0" upgrade(s)'],
          ['No new upgrades to run'],
          ['Deleting lock'],
          ['Setting running to false so other upgrade runs can occur'],
        ],
      })
    })
    it('does not run upgrades if current version is 1 and single upgrade', async () => {
      const currentVersion = 1
      const upgrades = [new TestUpgrade()]
      await testDbUpgrader({
        currentVersion,
        upgrades,
        debugCalls: [
          ['Setting running to true to prevent concurrent upgrade runs'],
          ['Current version: "1"'],
          ['allUpgrades has "1" upgrade(s)'],
          ['No new upgrades to run'],
          ['Deleting lock'],
          ['Setting running to false so other upgrade runs can occur'],
        ],
      })
    })
    it('runs single upgrade if one to run and none run before', async () => {
      const currentVersion = 0
      const upgrades = [new TestUpgrade()]
      const start = new Date()
      const end = new Date(start.getTime() + 1000 * 60) // 1 second
      await testDbUpgrader({
        currentVersion,
        upgrades,
        debugCalls: [
          ['Setting running to true to prevent concurrent upgrade runs'],
          ['Current version: "0"'],
          ['allUpgrades has "1" upgrade(s)'],
          ['Found "1" new upgrade(s) to run'],
          [`sleeping "${DbUpgrader['LOCK_REFRESH_SECONDS']}" second(s) before updating lock timeout`],
          ['finished: "false"'],
          ['Updating lock timeout'],
          [`sleeping "${DbUpgrader['LOCK_REFRESH_SECONDS']}" second(s) before updating lock timeout`],
          ['finished: "false"'],
          ['Updating lock timeout'],
          ['setting finished to true'],
          ['Deleting lock'],
          ['Setting running to false so other upgrade runs can occur'],
        ],
        infoCalls: [['Running upgrade "1"...'], ['...upgrade "1" complete']],
        dates: [start, end],
        addAttemptCalls: [
          [
            {
              version: 1,
              time: start,
            },
          ],
        ],
        addUpgradeCalls: [
          [
            {
              version: 1,
              start,
              end,
            },
          ],
        ],
        sleepCalls: [[DbUpgrader['LOCK_REFRESH_SECONDS']], [DbUpgrader['LOCK_REFRESH_SECONDS']]],
        updateLockCalls: [[], []],
      })
    })
    it('runs single upgrade if one to run and one run before', async () => {
      const currentVersion = 1
      const upgrades = [new TestUpgrade(), new TestUpgrade()]
      const start = new Date()
      const end = new Date(start.getTime() + 1000 * 60) // 1 second
      // TODO: look into changes that had to be made to see if they are legit
      await testDbUpgrader({
        currentVersion,
        upgrades,
        debugCalls: [
          ['Setting running to true to prevent concurrent upgrade runs'],
          ['Current version: "1"'],
          ['allUpgrades has "2" upgrade(s)'],
          ['Found "1" new upgrade(s) to run'],
          [`sleeping "${DbUpgrader['LOCK_REFRESH_SECONDS']}" second(s) before updating lock timeout`],
          ['finished: "false"'],
          ['Updating lock timeout'],
          [`sleeping "${DbUpgrader['LOCK_REFRESH_SECONDS']}" second(s) before updating lock timeout`],
          ['finished: "false"'],
          ['Updating lock timeout'],
          ['setting finished to true'],
          ['Deleting lock'],
          ['Setting running to false so other upgrade runs can occur'],
        ],
        infoCalls: [['Running upgrade "2"...'], ['...upgrade "2" complete']],
        dates: [start, end],
        addAttemptCalls: [
          [
            {
              version: 2,
              time: start,
            },
          ],
        ],
        addUpgradeCalls: [
          [
            {
              version: 2,
              start,
              end,
            },
          ],
        ],
        sleepCalls: [[DbUpgrader['LOCK_REFRESH_SECONDS']], [DbUpgrader['LOCK_REFRESH_SECONDS']]],
        updateLockCalls: [[], []],
      })
    })
    it('throws error if upgrade throws error', async () => {
      const error = 'bad upgrade'
      const currentVersion = 0
      const upgrade = new TestUpgrade()
      jest.spyOn(upgrade, 'run').mockRejectedValue(Error(error))
      const upgrades = [upgrade]
      const start = new Date()
      await testDbUpgrader({
        currentVersion,
        upgrades,
        error,
        debugCalls: [
          ['Setting running to true to prevent concurrent upgrade runs'],
          ['Current version: "0"'],
          ['allUpgrades has "1" upgrade(s)'],
          ['Found "1" new upgrade(s) to run'],
          [`sleeping "${DbUpgrader['LOCK_REFRESH_SECONDS']}" second(s) before updating lock timeout`],
          ['finished: "false"'],
          ['Updating lock timeout'],
          ['setting finished to true'],
          ['Deleting lock'],
          ['Setting running to false so other upgrade runs can occur'],
        ],
        infoCalls: [['Running upgrade "1"...']],
        errorCalls: [[`Error while running upgrade "1": "${Error(error)}"`]],
        dates: [start],
        addAttemptCalls: [
          [
            {
              version: 1,
              time: start,
            },
          ],
        ],
        addUpgradeCalls: [],
        sleepCalls: [[DbUpgrader['LOCK_REFRESH_SECONDS']]],
        updateLockCalls: [[]],
      })
    })
    it('throws error if lock update throws error', async () => {
      const error = 'document does not exist'
      const currentVersion = 0
      const upgrades = [new TestUpgrade(), new TestUpgrade()]
      const start = new Date()
      const end = new Date(start.getTime() + 1000 * 60) // 1 second
      await testDbUpgrader({
        currentVersion,
        upgrades,
        error,
        debugCalls: [
          ['Setting running to true to prevent concurrent upgrade runs'],
          ['Current version: "0"'],
          ['allUpgrades has "2" upgrade(s)'],
          ['Found "2" new upgrade(s) to run'],
          [`sleeping "${DbUpgrader['LOCK_REFRESH_SECONDS']}" second(s) before updating lock timeout`],
          ['finished: "false"'],
          ['Updating lock timeout'],
          ['setting finished to true due to lock update error'],
          ['setting finished to true'],
          ['Deleting lock'],
          ['Setting running to false so other upgrade runs can occur'],
        ],
        infoCalls: [['Running upgrade "1"...'], ['...upgrade "1" complete']],
        errorCalls: [[`Error while waiting and updating lock: "${Error(error)}"`]],
        dates: [start, end],
        addAttemptCalls: [
          [
            {
              version: 1,
              time: start,
            },
          ],
        ],
        addUpgradeCalls: [
          [
            {
              version: 1,
              start,
              end,
            },
          ],
        ],
        sleepCalls: [[DbUpgrader['LOCK_REFRESH_SECONDS']]],
        updateLockCalls: [[]],
        updateLockResponses: [() => Promise.reject(Error(error))],
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
          [`Attempting for "${DbUpgrader['LOCK_TIMEOUT_SECONDS']}" seconds to aquire lock`],
          [`Attempt "1" to aquire lock`],
          [`Lock aquired in "1" second(s)`],
        ],
        traceCalls: [['aquired: "true"'], ['sleepBeforeNextTry: "true"']],
      })
    })
    it('aquires lock if expired lock exists', async () => {
      const start = Date.now()
      const expired = new Date(start - DbUpgrader['LOCK_TIMEOUT_SECONDS'] * 1000 * 2)
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
          [`Attempting for "${DbUpgrader['LOCK_TIMEOUT_SECONDS']}" seconds to aquire lock`],
          [`Attempt "1" to aquire lock`],
          ['Lock already exists, checking if expired'],
          [
            `Greater than "${DbUpgrader['LOCK_TIMEOUT_SECONDS']}" seconds since lock last updated, deleting expired lock`,
          ],
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
    it('aquires lock if previous lock expires before LOCK_TIMEOUT_SECONDS', async () => {
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
              updated: new Date(start + DbUpgrader['LOCK_TIMEOUT_SECONDS'] * 1000),
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
        sleepCalls: [[DbUpgrader['LOCK_REFRESH_SECONDS']]],
        debugCalls: [
          [`Attempting for "${DbUpgrader['LOCK_TIMEOUT_SECONDS']}" seconds to aquire lock`],
          [`Attempt "1" to aquire lock`],
          ['Lock already exists, checking if expired'],
          ['Lock not expired, previous lock still running'],
          [`Lock not aquired after "2" second(s), sleeping for "${DbUpgrader['LOCK_REFRESH_SECONDS']}" second(s)`],
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
        debugCalls: [
          [`Attempting for "${DbUpgrader['LOCK_TIMEOUT_SECONDS']}" seconds to aquire lock`],
          [`Attempt "1" to aquire lock`],
        ],
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
          start + DbUpgrader['LOCK_TIMEOUT_SECONDS'] * 1000 * 2, // loop check 2
          start + DbUpgrader['LOCK_TIMEOUT_SECONDS'] * 1000 * 2, // duration
        ],
        addLockResponses: [() => Promise.reject(error)],
        getLockResponses: [
          () =>
            Promise.resolve({
              _id: UpgradeStore['LOCK_ID'],
              updated: new Date(start + DbUpgrader['LOCK_TIMEOUT_SECONDS'] * 1000 - 1),
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
        sleepCalls: [[DbUpgrader['LOCK_REFRESH_SECONDS']]],
        error: 'Could not aquire lock after "60" seconds',
        debugCalls: [
          [`Attempting for "${DbUpgrader['LOCK_TIMEOUT_SECONDS']}" seconds to aquire lock`],
          [`Attempt "1" to aquire lock`],
          ['Lock already exists, checking if expired'],
          ['Lock not expired, previous lock still running'],
          [`Lock not aquired after "2" second(s), sleeping for "${DbUpgrader['LOCK_REFRESH_SECONDS']}" second(s)`],
        ],
        traceCalls: [['secondsSinceLastUpdate: "-28.999"'], ['aquired: "false"'], ['sleepBeforeNextTry: "true"']],
      })
    })
    it('logs out if trace log enabled', async () => {
      const start = Date.now()
      const error = new MongoError('duplicate key')
      const addLockResponse = {
        _id: new ObjectId(),
        updated: new Date(),
      }
      const getLockResponse = {
        _id: UpgradeStore['LOCK_ID'],
        updated: new Date(start + DbUpgrader['LOCK_TIMEOUT_SECONDS'] * 1000 - 1),
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
        sleepCalls: [[DbUpgrader['LOCK_REFRESH_SECONDS']]],
        debugCalls: [
          [`Attempting for "${DbUpgrader['LOCK_TIMEOUT_SECONDS']}" seconds to aquire lock`],
          [`Attempt "1" to aquire lock`],
          ['Lock already exists, checking if expired'],
          ['Lock not expired, previous lock still running'],
          [`Lock not aquired after "2" second(s), sleeping for "${DbUpgrader['LOCK_REFRESH_SECONDS']}" second(s)`],
          [`Attempt "2" to aquire lock`],
          [`Lock aquired in "3" second(s)`],
        ],
        isTraceEnabled: true,
        traceCalls: [
          [
            `err: "${JSON.stringify({
              code: error.code,
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
              updated: new Date(start - DbUpgrader['LOCK_TIMEOUT_SECONDS'] * 1000 * 2),
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
        sleepCalls: [[DbUpgrader['LOCK_REFRESH_SECONDS']]],
        debugCalls: [
          [`Attempting for "${DbUpgrader['LOCK_TIMEOUT_SECONDS']}" seconds to aquire lock`],
          [`Attempt "1" to aquire lock`],
          ['Lock already exists, checking if expired'],
          [
            `Greater than "${DbUpgrader['LOCK_TIMEOUT_SECONDS']}" seconds since lock last updated, deleting expired lock`,
          ],
          [`Lock not aquired after "1" second(s), sleeping for "${DbUpgrader['LOCK_REFRESH_SECONDS']}" second(s)`],
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
})

async function testDbUpgrader({
  running = false,
  currentVersion,
  upgrades,
  dates = [],
  error,
  aquireLockCalls = [[]],
  currentVersionCalls = [[]],
  getUpgradesCalls = [[]],
  deleteLockCalls = [[]],
  addAttemptCalls = [],
  addUpgradeCalls = [],
  sleepCalls = [],
  updateLockCalls = [],
  updateLockResponses,
  aquireLockError,
  debugCalls = [],
  infoCalls = [],
  errorCalls = [],
}: {
  running?: boolean
  currentVersion?: number
  upgrades?: Upgrade[]
  dates?: Date[]
  error?: string
  aquireLockCalls?: any[][]
  currentVersionCalls?: any[][]
  getUpgradesCalls?: any[][]
  deleteLockCalls?: any[][]
  addAttemptCalls?: any[][]
  addUpgradeCalls?: any[][]
  sleepCalls?: any[][]
  updateLockCalls?: any[][]
  updateLockResponses?: any[]
  aquireLockError?: string
  debugCalls?: string[][]
  infoCalls?: string[][]
  errorCalls?: string[][]
}) {
  DbUpgrader['running'] = running
  const debugSpy = jest.fn().mockImplementation()
  const infoSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  DbUpgrader['logger'] = {
    debug: debugSpy,
    info: infoSpy,
    error: errorSpy,
  } as any

  const aquireLockSpy = jest.spyOn(DbUpgrader as any, 'aquireLock').mockImplementation(() => {
    return new Promise((resolve, reject) => {
      if (aquireLockError) {
        reject(Error(aquireLockError))
      } else {
        resolve(undefined)
      }
    })
  })
  const currentVersionSpy = jest.spyOn(UpgradeStore, 'getCurrentVersion').mockResolvedValue(currentVersion as any)
  const getUpgradesSpy = jest.spyOn(DbUpgrader as any, 'getUpgrades').mockReturnValue(upgrades)
  const deleteLockSpy = jest.spyOn(UpgradeStore, 'deleteLock').mockImplementation()
  const dateSpy = jest.spyOn(global, 'Date')
  for (const date of dates) {
    dateSpy.mockImplementationOnce(() => date)
  }
  const addAttemptSpy = jest.spyOn(UpgradeStore, 'addAttempt').mockImplementation()
  const addUpgradeSpy = jest.spyOn(UpgradeStore, 'addUpgrade').mockImplementation()
  const sleepSpy = jest.spyOn(utils, 'sleep').mockImplementation()
  const updateLockSpy = jest.spyOn(UpgradeStore, 'updateLock')
  if (updateLockResponses) {
    for (const updateLockResponse of updateLockResponses) {
      updateLockSpy.mockImplementationOnce(updateLockResponse)
    }
  } else {
    updateLockSpy.mockImplementation()
  }

  const promise = DbUpgrader.run()
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(undefined)
  }

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(infoSpy.mock.calls).toEqual(infoCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(aquireLockSpy.mock.calls).toEqual(aquireLockCalls)
  expect(currentVersionSpy.mock.calls).toEqual(currentVersionCalls)
  expect(getUpgradesSpy.mock.calls).toEqual(getUpgradesCalls)
  expect(deleteLockSpy.mock.calls).toEqual(deleteLockCalls)
  expect(dateSpy.mock.calls).toEqual(dates.length === 0 ? [] : dates.map(() => []))
  expect(addAttemptSpy.mock.calls).toEqual(addAttemptCalls)
  expect(addUpgradeSpy.mock.calls).toEqual(addUpgradeCalls)
  expect(sleepSpy.mock.calls).toEqual(sleepCalls)
  expect(updateLockSpy.mock.calls).toEqual(updateLockCalls)
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

  const promise = DbUpgrader['aquireLock']()
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

class TestUpgrade extends Upgrade {
  async run() {
    await Promise.resolve()
  }
}
