import { ObjectId } from 'mongodb'

import UpgradeStore, { LockDbObject, UpgradeDbObject } from '../../src/database/upgrade-store'

describe('upgrade-store', () => {
  describe('addLock', () => {
    it('calls to create method with hard-coded lock _id', async () => {
      const traceSpy = jest.fn().mockImplementation()
      UpgradeStore['logger'] = {
        trace: traceSpy,
        isTraceEnabled: jest.fn().mockReturnValue(true),
      } as any
      const mockedDate = new Date()
      const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockedDate)
      const lock = {
        _id: UpgradeStore['LOCK_ID'],
        updated: mockedDate,
      }
      const createSpy = jest.spyOn(UpgradeStore, 'create').mockResolvedValue(lock)

      await expect(UpgradeStore.addLock()).resolves.toEqual(lock)

      expect(createSpy.mock.calls).toEqual([[lock]])
      expect(traceSpy.mock.calls).toEqual([[`Adding lock with updated: "${mockedDate}"`]])
      expect(dateSpy.mock.calls).toEqual([[]])
    })
  })
  describe('updateLock', () => {
    it('calls to update method with hard-coded lock _id', async () => {
      const traceSpy = jest.fn().mockImplementation()
      UpgradeStore['logger'] = {
        trace: traceSpy,
        isTraceEnabled: jest.fn().mockReturnValue(true),
      } as any
      const mockedDate = new Date()
      const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockedDate)
      const lock = {
        _id: UpgradeStore['LOCK_ID'],
        updated: mockedDate,
      }
      const updateSpy = jest.spyOn(UpgradeStore, 'update').mockResolvedValue(lock)

      await expect(UpgradeStore.updateLock()).resolves.toEqual(lock)

      expect(updateSpy.mock.calls).toEqual([[lock]])
      expect(traceSpy.mock.calls).toEqual([[`Updating lock with updated: "${mockedDate}"`]])
      expect(dateSpy.mock.calls).toEqual([[]])
    })
  })
  describe('getLock', () => {
    it('calls to read method and returns undefined if no locks returned', async () => {
      await testGetLock({
        locks: [],
      })
    })
    it('calls to read method and returns lock if single lock returned', async () => {
      await testGetLock({
        locks: [
          {
            _id: UpgradeStore['LOCK_ID'],
            updated: new Date(),
          },
        ],
      })
    })
    it('calls to read method and throws error if multiple locks returned', async () => {
      const locks = [
        {
          _id: UpgradeStore['LOCK_ID'],
          updated: new Date(),
        },
        {
          _id: UpgradeStore['LOCK_ID'],
          updated: new Date(),
        },
      ]
      await testGetLock({
        locks,
        error: `More than 1 upgrade lock document found: "${JSON.stringify(locks)}"`,
      })
    })
    it('logs out locks if trace enabled', async () => {
      const locks = [
        {
          _id: UpgradeStore['LOCK_ID'],
          updated: new Date(),
        },
      ]
      await testGetLock({
        locks,
        traceEnabled: true,
        traces: [[`getLock docs: "${JSON.stringify(locks)}"`]],
      })
    })
  })
  describe('deleteLock', () => {
    it('calls to delete method', async () => {
      const traceSpy = jest.fn().mockImplementation()
      UpgradeStore['logger'] = {
        trace: traceSpy,
        isTraceEnabled: jest.fn().mockReturnValue(true),
      } as any
      const lock = {
        _id: UpgradeStore['LOCK_ID'],
        updated: new Date(),
      }
      const deleteSpy = jest.spyOn(UpgradeStore, 'delete').mockResolvedValue(lock)

      await expect(UpgradeStore.deleteLock()).resolves.toEqual(lock)

      expect(deleteSpy.mock.calls).toEqual([[UpgradeStore['LOCK_ID']]])
      expect(traceSpy.mock.calls).toEqual([['Deleting lock']])
    })
  })
  describe('getCurrentVersion', () => {
    it('calls to read method and returns 0 if no upgrades returned', async () => {
      await testGetCurrentVersion({
        upgrades: [],
        expected: 0,
      })
    })
    it('calls to read method and returns upgrade version if single upgrade returned', async () => {
      const version = 1
      await testGetCurrentVersion({
        upgrades: [
          {
            _id: new ObjectId(),
            version,
            start: new Date(),
            end: new Date(),
          },
        ],
        expected: version,
      })
    })
    it('calls to read method and throws error if multiple upgrades returned', async () => {
      const upgrades = [
        {
          _id: new ObjectId(),
          version: 2,
          start: new Date(),
          end: new Date(),
        },
        {
          _id: new ObjectId(),
          version: 1,
          start: new Date(),
          end: new Date(),
        },
      ]
      await testGetCurrentVersion({
        upgrades,
        error: `More than 1 doc returned for current upgrade version: "${JSON.stringify(upgrades)}"`,
      })
    })
    it('logs out upgrade docs if trace enabled', async () => {
      const version = 1
      const upgrades = [
        {
          _id: new ObjectId(),
          version,
          start: new Date(),
          end: new Date(),
        },
      ]
      await testGetCurrentVersion({
        upgrades,
        expected: version,
        traceEnabled: true,
        traces: [[`getCurrentVersion docs: "${JSON.stringify(upgrades)}"`]],
      })
    })
  })
  describe('addAttempt', () => {
    it('calls to create method', async () => {
      await testAddAttempt({
        version: 1,
        time: new Date(),
      })
    })
    it('logs out attempt doc if trace enabled', async () => {
      const attempt = {
        version: 1,
        time: new Date(),
      }
      await testAddAttempt({
        version: attempt.version,
        time: attempt.time,
        traceEnabled: true,
        traces: [[`addAttempt doc: "${JSON.stringify(attempt)}"`]],
      })
    })
  })
  describe('getAttempts', () => {
    it('calls to read method with proper filters and options', async () => {
      const attempts = [
        {
          _id: new ObjectId(),
          version: 1,
          time: new Date(),
        },
      ]
      const readSpy = jest.spyOn(UpgradeStore, 'read').mockResolvedValue(attempts)

      await expect(UpgradeStore.getAttempts()).resolves.toEqual(attempts)

      expect(readSpy.mock.calls).toEqual([
        [
          {
            filter: {
              time: {
                $exists: true,
              },
            },
            options: {
              sort: {
                time: -1,
              },
            },
          },
        ],
      ])
    })
  })
  describe('addUpgrade', () => {
    it('calls to create method', async () => {
      await testAddUpgrade({
        version: 1,
        start: new Date(),
        end: new Date(),
      })
    })
    it('logs out attempt doc if trace enabled', async () => {
      const upgrade = {
        version: 1,
        start: new Date(),
        end: new Date(),
      }
      await testAddUpgrade({
        version: upgrade.version,
        start: upgrade.start,
        end: upgrade.end,
        traceEnabled: true,
        traces: [[`addUpgrade doc: "${JSON.stringify(upgrade)}"`]],
      })
    })
  })
  describe('getUpgrades', () => {
    it('calls to read method with proper filters and options', async () => {
      const upgrades = [
        {
          _id: new ObjectId(),
          version: 1,
          start: new Date(),
          end: new Date(),
        },
      ]
      const readSpy = jest.spyOn(UpgradeStore, 'read').mockResolvedValue(upgrades)

      await expect(UpgradeStore.getUpgrades()).resolves.toEqual(upgrades)

      expect(readSpy.mock.calls).toEqual([
        [
          {
            filter: {
              end: {
                $exists: true,
              },
            },
            options: {
              sort: {
                version: -1,
              },
            },
          },
        ],
      ])
    })
  })
})

async function testGetLock({
  locks,
  traceEnabled,
  traces = [],
  error,
}: {
  locks: LockDbObject[]
  traceEnabled?: boolean
  traces?: string[][]
  error?: string
}) {
  const traceSpy = jest.fn().mockImplementation()
  UpgradeStore['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any
  const readSpy = jest.spyOn(UpgradeStore, 'read').mockResolvedValue(locks)

  if (error) {
    await expect(UpgradeStore.getLock()).rejects.toThrow(error)
  } else {
    await expect(UpgradeStore.getLock()).resolves.toEqual(locks[0])
  }

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter: {
          _id: UpgradeStore['LOCK_ID'],
        },
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(traces)
}

async function testGetCurrentVersion({
  upgrades,
  expected,
  traceEnabled,
  traces = [],
  error,
}: {
  upgrades: UpgradeDbObject[]
  expected?: number
  traceEnabled?: boolean
  traces?: string[][]
  error?: string
}) {
  const traceSpy = jest.fn().mockImplementation()
  UpgradeStore['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any
  const readSpy = jest.spyOn(UpgradeStore, 'read').mockResolvedValue(upgrades)

  if (error) {
    await expect(UpgradeStore.getCurrentVersion()).rejects.toThrow(error)
  } else {
    await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(expected)
  }

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter: {
          end: {
            $exists: true,
          },
        },
        options: {
          sort: {
            version: -1,
          },
          limit: 1,
        },
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(traces)
}

async function testAddAttempt({
  version,
  time,
  traceEnabled,
  traces = [],
}: {
  version: number
  time: Date
  traceEnabled?: boolean
  traces?: string[][]
}) {
  const traceSpy = jest.fn().mockImplementation()
  UpgradeStore['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any
  const attempt = {
    _id: new ObjectId(),
    version,
    time,
  }
  const createSpy = jest.spyOn(UpgradeStore, 'create').mockResolvedValue(attempt)

  await expect(UpgradeStore.addAttempt(attempt)).resolves.toEqual(attempt)

  expect(createSpy.mock.calls).toEqual([
    [
      {
        version,
        time,
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(traces)
}

async function testAddUpgrade({
  version,
  start,
  end,
  traceEnabled,
  traces = [],
}: {
  version: number
  start: Date
  end: Date
  traceEnabled?: boolean
  traces?: string[][]
}) {
  const traceSpy = jest.fn().mockImplementation()
  UpgradeStore['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any
  const upgrade = {
    _id: new ObjectId(),
    version,
    start,
    end,
  }
  const createSpy = jest.spyOn(UpgradeStore, 'create').mockResolvedValue(upgrade)

  await expect(UpgradeStore.addUpgrade(upgrade)).resolves.toEqual(upgrade)

  expect(createSpy.mock.calls).toEqual([
    [
      {
        version,
        start,
        end,
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(traces)
}
