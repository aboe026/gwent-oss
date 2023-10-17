import { ObjectId } from 'mongodb'

describe('upgrade-store', () => {
  describe('addLock', () => {
    it('calls to create method with hard-coded lock _id', async () => {
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(true),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const createSpy = jest.spyOn(UpgradeStore, 'create').mockImplementation()
      const mockedDate = new Date()
      const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockedDate)

      await expect(UpgradeStore.addLock()).resolves.toEqual(undefined)

      expect(createSpy.mock.calls).toEqual([
        [
          {
            _id: UpgradeStore.LOCK_ID,
            updated: mockedDate,
          },
        ],
      ])
      expect(traceSpy.mock.calls).toEqual([[`Adding lock with updated: "${mockedDate}"`]])
      expect(dateSpy.mock.calls).toEqual([[]])
    })
  })
  describe('updateLock', () => {
    it('calls to update method with hard-coded lock _id', async () => {
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(true),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const updateSpy = jest.spyOn(UpgradeStore, 'update').mockImplementation()
      const mockedDate = new Date()
      const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockedDate)

      await expect(UpgradeStore.updateLock()).resolves.toEqual(undefined)

      expect(updateSpy.mock.calls).toEqual([
        [
          {
            _id: UpgradeStore.LOCK_ID,
            updated: mockedDate,
          },
        ],
      ])
      expect(traceSpy.mock.calls).toEqual([[`Updating lock with updated: "${mockedDate}"`]])
      expect(dateSpy.mock.calls).toEqual([[]])
    })
  })
  describe('getLock', () => {
    it('calls to read method and returns undefined if no locks returned', async () => {
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(false),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const readSpy = jest.spyOn(UpgradeStore, 'read').mockResolvedValue([])

      await expect(UpgradeStore.getLock()).resolves.toEqual(undefined)

      expect(readSpy.mock.calls).toEqual([
        [
          {
            filter: {
              _id: UpgradeStore.LOCK_ID,
            },
          },
        ],
      ])
      expect(traceSpy.mock.calls).toEqual([])
    })
    it('calls to read method and returns lock if single lock returned', async () => {
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(false),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const locks = [
        {
          _id: UpgradeStore.LOCK_ID,
          updated: new Date(),
        },
      ]
      const readSpy = jest.spyOn(UpgradeStore, 'read').mockResolvedValue(locks)

      await expect(UpgradeStore.getLock()).resolves.toEqual(locks[0])

      expect(readSpy.mock.calls).toEqual([
        [
          {
            filter: {
              _id: UpgradeStore.LOCK_ID,
            },
          },
        ],
      ])
      expect(traceSpy.mock.calls).toEqual([])
    })
    it('calls to read method and throws error if multiple locks returned', async () => {
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(false),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const locks = [
        {
          _id: UpgradeStore.LOCK_ID,
          updated: new Date(),
        },
        {
          _id: UpgradeStore.LOCK_ID,
          updated: new Date(),
        },
      ]
      const readSpy = jest.spyOn(UpgradeStore, 'read').mockResolvedValue(locks)

      await expect(UpgradeStore.getLock()).rejects.toThrow(
        `More than 1 upgrade lock document found: "${JSON.stringify(locks)}"`
      )

      expect(readSpy.mock.calls).toEqual([
        [
          {
            filter: {
              _id: UpgradeStore.LOCK_ID,
            },
          },
        ],
      ])
      expect(traceSpy.mock.calls).toEqual([])
    })
    it('logs out locks if trace enabled', async () => {
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(true),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const locks = [
        {
          _id: UpgradeStore.LOCK_ID,
          updated: new Date(),
        },
      ]
      const readSpy = jest.spyOn(UpgradeStore, 'read').mockResolvedValue(locks)

      await expect(UpgradeStore.getLock()).resolves.toEqual(locks[0])

      expect(readSpy.mock.calls).toEqual([
        [
          {
            filter: {
              _id: UpgradeStore.LOCK_ID,
            },
          },
        ],
      ])
      expect(traceSpy.mock.calls).toEqual([[`getLock docs: "${JSON.stringify(locks)}"`]])
    })
  })
  describe('deleteLock', () => {
    it('calls to delete method', async () => {
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(false),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const deleteSpy = jest.spyOn(UpgradeStore, 'delete').mockResolvedValue(undefined)

      await expect(UpgradeStore.deleteLock()).resolves.toEqual(undefined)

      expect(deleteSpy.mock.calls).toEqual([[UpgradeStore.LOCK_ID]])
      expect(traceSpy.mock.calls).toEqual([['Deleting lock']])
    })
  })
  describe('getCurrentVersion', () => {
    it('calls to read method and returns 0 if no upgrades returned', async () => {
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(false),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const upgrades: any = [] // eslint-disable-line @typescript-eslint/no-explicit-any
      const readSpy = jest.spyOn(UpgradeStore, 'read').mockResolvedValue(upgrades)

      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(0)

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
      expect(traceSpy.mock.calls).toEqual([])
    })
    it('calls to read method and returns upgrade version if single upgrade returned', async () => {
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(false),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const upgrades: any = [
        {
          _id: new ObjectId(),
          version: 1,
          start: new Date(),
          end: new Date(),
        },
      ]
      const readSpy = jest.spyOn(UpgradeStore, 'read').mockResolvedValue(upgrades)

      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(1)

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
      expect(traceSpy.mock.calls).toEqual([])
    })
    it('calls to read method and throws error if multiple upgrades returned', async () => {
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(false),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const upgrades: any = [
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
      const readSpy = jest.spyOn(UpgradeStore, 'read').mockResolvedValue(upgrades)

      await expect(UpgradeStore.getCurrentVersion()).rejects.toThrow(
        `More than 1 doc returned for current upgrade version: "${JSON.stringify(upgrades)}"`
      )

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
      expect(traceSpy.mock.calls).toEqual([])
    })
    it('logs out upgrade docs if trace enabled', async () => {
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(true),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const upgrades: any = [
        {
          _id: new ObjectId(),
          version: 1,
          start: new Date(),
          end: new Date(),
        },
      ]
      const readSpy = jest.spyOn(UpgradeStore, 'read').mockResolvedValue(upgrades)

      await expect(UpgradeStore.getCurrentVersion()).resolves.toEqual(1)

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
      expect(traceSpy.mock.calls).toEqual([[`getCurrentVersion docs: "${JSON.stringify(upgrades)}"`]])
    })
  })
  describe('addAttempt', () => {
    it('calls to create method', async () => {
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(false),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const createSpy = jest.spyOn(UpgradeStore, 'create').mockImplementation()
      const attempt = {
        version: 1,
        time: new Date(),
      }

      await expect(UpgradeStore.addAttempt(attempt)).resolves.toEqual(undefined)

      expect(createSpy.mock.calls).toEqual([[attempt]])
      expect(traceSpy.mock.calls).toEqual([])
    })
    it('logs out attempt doc if trace enabled', async () => {
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(true),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const createSpy = jest.spyOn(UpgradeStore, 'create').mockImplementation()
      const attempt = {
        version: 1,
        time: new Date(),
      }

      await expect(UpgradeStore.addAttempt(attempt)).resolves.toEqual(undefined)

      expect(createSpy.mock.calls).toEqual([[attempt]])
      expect(traceSpy.mock.calls).toEqual([[`addAttempt doc: "${JSON.stringify(attempt)}"`]])
    })
  })
  describe('getAttempts', () => {
    it('calls to read method with proper filters and options', async () => {
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const readSpy = jest.spyOn(UpgradeStore, 'read').mockImplementation()

      await expect(UpgradeStore.getAttempts()).resolves.toEqual(undefined)

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
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(false),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const createSpy = jest.spyOn(UpgradeStore, 'create').mockImplementation()
      const upgrade = {
        version: 1,
        start: new Date(),
        end: new Date(),
      }

      await expect(UpgradeStore.addUpgrade(upgrade)).resolves.toEqual(undefined)

      expect(createSpy.mock.calls).toEqual([[upgrade]])
      expect(traceSpy.mock.calls).toEqual([])
    })
    it('logs out attempt doc if trace enabled', async () => {
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(true),
        }),
      }))
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const createSpy = jest.spyOn(UpgradeStore, 'create').mockImplementation()
      const upgrade = {
        version: 1,
        start: new Date(),
        end: new Date(),
      }

      await expect(UpgradeStore.addUpgrade(upgrade)).resolves.toEqual(undefined)

      expect(createSpy.mock.calls).toEqual([[upgrade]])
      expect(traceSpy.mock.calls).toEqual([[`addUpgrade doc: "${JSON.stringify(upgrade)}"`]])
    })
  })
  describe('getUpgrades', () => {
    it('calls to read method with proper filters and options', async () => {
      const UpgradeStore = require('../../src/database/upgrade-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const readSpy = jest.spyOn(UpgradeStore, 'read').mockImplementation()

      await expect(UpgradeStore.getUpgrades()).resolves.toEqual(undefined)

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
