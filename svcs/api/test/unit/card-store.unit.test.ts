import { Combat, Dlc, Effect, Faction } from '../../src/database/generated-typings'

describe('card-store', () => {
  describe('getLeaders', () => {
    it('calls to read method with type of Leader and projection against type', async () => {
      const CardStore = require('../../src/database/card-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const readSpy = jest.spyOn(CardStore, 'read').mockImplementation()

      await expect(CardStore.getLeaders()).resolves.toEqual(undefined)

      expect(readSpy.mock.calls).toEqual([
        [
          {
            filter: {
              type: 'LEADER',
            },
            options: {
              projection: {
                type: 0,
              },
            },
          },
        ],
      ])
    })
  })
  describe('getUnits', () => {
    it('calls to read method with type of Unit and projection against type', async () => {
      const CardStore = require('../../src/database/card-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const readSpy = jest.spyOn(CardStore, 'read').mockImplementation()

      await expect(CardStore.getUnits()).resolves.toEqual(undefined)

      expect(readSpy.mock.calls).toEqual([
        [
          {
            filter: {
              type: 'UNIT',
            },
            options: {
              projection: {
                type: 0,
              },
            },
          },
        ],
      ])
    })
  })
  describe('addLeader', () => {
    it('calls to create method', async () => {
      const leader = {
        name: 'leader-name',
        faction: Faction.Neutral,
        dlc: Dlc.HeartsOfStone,
      }
      const CardStore = require('../../src/database/card-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const createSpy = jest.spyOn(CardStore, 'create').mockReturnValue(leader)

      await expect(CardStore.addLeader(leader)).resolves.toEqual(leader)

      expect(createSpy.mock.calls).toEqual([
        [
          {
            type: 'LEADER',
            ...leader,
          },
        ],
      ])
    })
    it('logs out card if trace enabled', async () => {
      const leader = {
        name: 'leader-name',
        faction: Faction.Neutral,
        dlc: Dlc.HeartsOfStone,
      }
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(true),
        }),
      }))
      const CardStore = require('../../src/database/card-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const createSpy = jest.spyOn(CardStore, 'create').mockReturnValue(leader)

      await expect(CardStore.addLeader(leader)).resolves.toEqual(leader)

      const convertedLeader = {
        type: 'LEADER',
        ...leader,
      }
      expect(createSpy.mock.calls).toEqual([[convertedLeader]])
      expect(traceSpy.mock.calls).toEqual([[`Adding leader: "${JSON.stringify(convertedLeader)}"`]])
    })
  })
  describe('addUnit', () => {
    it('calls to create method', async () => {
      const unit = {
        name: 'unit-name',
        faction: Faction.Neutral,
        dlc: Dlc.HeartsOfStone,
        occurrences: 1,
        hero: true,
        combats: [Combat.Ranged],
        strength: 12,
        effects: [Effect.Morale],
        scorchScope: Combat.Close,
        scorchMin: 10,
        musterPrefix: 'special',
      }
      const CardStore = require('../../src/database/card-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const createSpy = jest.spyOn(CardStore, 'create').mockReturnValue(unit)

      await expect(CardStore.addUnit(unit)).resolves.toEqual(unit)

      expect(createSpy.mock.calls).toEqual([
        [
          {
            type: 'UNIT',
            ...unit,
          },
        ],
      ])
    })
    it('logs out card if trace enabled', async () => {
      const unit = {
        name: 'unit-name',
        occurrences: 1,
        faction: Faction.Neutral,
        dlc: Dlc.HeartsOfStone,
        hero: true,
        combats: [Combat.Ranged],
        strength: 12,
        effects: [Effect.Morale],
        scorchScope: Combat.Close,
        scorchMin: 10,
        musterPrefix: 'special',
      }
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          trace: traceSpy,
          isTraceEnabled: jest.fn().mockReturnValue(true),
        }),
      }))
      const CardStore = require('../../src/database/card-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const createSpy = jest.spyOn(CardStore, 'create').mockReturnValue(unit)

      await expect(CardStore.addUnit(unit)).resolves.toEqual(unit)

      const convertedUnit = {
        type: 'UNIT',
        ...unit,
      }
      expect(createSpy.mock.calls).toEqual([[convertedUnit]])
      expect(traceSpy.mock.calls).toEqual([[`Adding unit: "${JSON.stringify(convertedUnit)}"`]])
    })
  })
})
