import AdminDb from '../../src/database/upgrades/admin-db'
import DbConnector from '../../src/database/db-connector'
import * as env from '../../src/env'
import Upgrade6 from '../../src/database/upgrades/upgrade-6'

describe('upgrade-6', () => {
  describe('run', () => {
    it('does nothing if syncFcv is false', async () => {
      await testRun({
        syncFcv: false,
      })
    })
    it('does nothing if fcv is already at desired one', async () => {
      await testRun({
        currentFcv: '9.0',
      })
    })
    it('does nothing if fcv is above desired one', async () => {
      await testRun({
        currentFcv: '9.3',
      })
    })
    it('throws error if fcv lower than desired but incompatible database version', async () => {
      await testRun({
        currentFcv: '8.3',
        currentDbVersion: '8.3.8',
        expected: Error(
          `Current MongoDB database version "8.3.8" is less than the required version of "9.0". Upgrade MongoDB instance to proceed.`
        ),
      })
    })
    it('updates feature compatibility version if current one is less and database version adequate', async () => {
      await testRun({
        currentFcv: '8.3',
        currentDbVersion: '9.0.8',
      })
    })
  })
})

async function testRun({
  syncFcv = true,
  currentFcv,
  currentDbVersion,
  expected,
}: {
  syncFcv?: boolean
  currentFcv?: string
  currentDbVersion?: string
  expected?: undefined | Error
}) {
  const desiredFcv = '9.0'
  const envSpy = jest.spyOn(env, 'default').mockReturnValue({
    SYNC_FCV: syncFcv,
  } as any)
  const connectSpy = jest.spyOn(DbConnector, 'connect').mockImplementation()
  const getFcvSpy = jest.spyOn(AdminDb, 'getFeatureCompatibilityVersion')
  if (currentFcv) {
    getFcvSpy.mockResolvedValue(currentFcv)
  }
  const getDbVersionSpy = jest.spyOn(AdminDb, 'getDatabaseVersion')
  if (currentDbVersion) {
    getDbVersionSpy.mockResolvedValue(currentDbVersion)
  }
  const setFcvSpy = jest.spyOn(AdminDb, 'setFeatureCompatibilityVersion').mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  Upgrade6['logger'] = {
    error: errorSpy,
    debug: debugSpy,
    trace: traceSpy,
  } as any

  const promise = new Upgrade6().run()
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(undefined)
  }

  expect(envSpy.mock.calls).toEqual([[]])
  expect(connectSpy.mock.calls).toEqual(syncFcv ? [[]] : [])
  expect(getFcvSpy.mock.calls).toEqual(syncFcv ? [[]] : [])
  expect(getDbVersionSpy.mock.calls).toEqual(currentDbVersion ? [[]] : [])
  expect(setFcvSpy.mock.calls).toEqual(currentDbVersion && !(expected instanceof Error) ? [[desiredFcv]] : [])
  expect(errorSpy.mock.calls).toEqual(
    expected instanceof Error
      ? [
          [
            `Current MongoDB database version "${currentDbVersion}" is less than the required version of "${desiredFcv}". Upgrade MongoDB instance to proceed.`,
          ],
        ]
      : []
  )
  const debugCalls = []
  const traceCalls = [[`syncFcv: "${syncFcv}"`]]
  if (syncFcv) {
    debugCalls.push(['Connecting to database'])
    debugCalls.push(['Getting current FCV'])
    traceCalls.push([`currentFcv: "${currentFcv}"`])
    if (currentDbVersion) {
      debugCalls.push([
        `Current FCV "${currentFcv}" is less than desired FCV "${desiredFcv}", checking Database version for ability to automatically upgrade FCV`,
      ])
      traceCalls.push([`currentDbVersion: "${currentDbVersion}"`])
      if (!(expected instanceof Error)) {
        debugCalls.push([`Upgrading FCV from "${currentFcv}" to "${desiredFcv}"`])
      }
    } else {
      debugCalls.push([
        `Current FCV "${currentFcv}" not less than desired FCV of "${desiredFcv}", no upgrade necessary`,
      ])
    }
  } else {
    debugCalls.push(['Environment variable SYNC_FCV not truthy, so not attempting to check or upgrade FCV.'])
  }
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
