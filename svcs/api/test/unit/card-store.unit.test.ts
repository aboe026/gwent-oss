import { ObjectId } from 'mongodb'

import CardStore, { AddLeaderInput, CARD_TYPE } from '../../src/database/card-store'
import { Combat, Dlc, Effect, Faction } from '../../src/database/generated-typings'

describe('card-store', () => {
  describe('getLeaders', () => {
    it('calls to read method with type of Leader and projection against type', async () => {
      const readSpy = jest.spyOn(CardStore, 'read').mockResolvedValue([])

      await expect(CardStore.getLeaders()).resolves.toEqual([])

      expect(readSpy.mock.calls).toEqual([
        [
          {
            filter: {
              type: CARD_TYPE.Leader,
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
      const readSpy = jest.spyOn(CardStore, 'read').mockResolvedValue([])

      await expect(CardStore.getUnits()).resolves.toEqual([])

      expect(readSpy.mock.calls).toEqual([
        [
          {
            filter: {
              type: CARD_TYPE.Unit,
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
      const _id = new ObjectId()
      const created = new Date()
      const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => created)
      const createSpy = jest.spyOn(CardStore, 'create').mockResolvedValue({
        _id,
        created,
        ...leader,
      })

      await expect(CardStore.addLeader(leader)).resolves.toEqual({
        _id,
        created,
        ...leader,
      })

      expect(createSpy.mock.calls).toEqual([
        [
          {
            type: CARD_TYPE.Leader,
            created,
            ...leader,
          },
        ],
      ])
      expect(dateSpy.mock.calls).toEqual([[]])
    })
    it('logs out card if trace enabled', async () => {
      const leader: AddLeaderInput = {
        name: 'leader-name',
        faction: Faction.Neutral,
        dlc: Dlc.BloodAndWine,
      }
      const traceSpy = jest.fn().mockImplementation()
      CardStore['logger'] = {
        isTraceEnabled: jest.fn().mockReturnValue(true),
        trace: traceSpy,
      } as any
      const _id = new ObjectId()
      const created = new Date()
      const dateSpy = jest.spyOn(global, 'Date').mockReturnValue(created)
      const createSpy = jest.spyOn(CardStore, 'create').mockImplementation((card) =>
        Promise.resolve({
          _id,
          created,
          ...card,
        })
      )

      await expect(CardStore.addLeader(leader)).resolves.toEqual({
        _id,
        created,
        type: CARD_TYPE.Leader,
        ...leader,
      })

      const convertedLeader = {
        type: 'LEADER',
        created,
        ...leader,
      }
      expect(createSpy.mock.calls).toEqual([[convertedLeader]])
      expect(traceSpy.mock.calls).toEqual([[`Adding leader: "${JSON.stringify(convertedLeader)}"`]])
      expect(dateSpy.mock.calls).toEqual([[]])
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
      const _id = new ObjectId()
      const created = new Date()
      const dateSpy = jest.spyOn(global, 'Date').mockReturnValue(created)
      const createSpy = jest.spyOn(CardStore, 'create').mockResolvedValue({
        _id,
        created,
        ...unit,
      })

      await expect(CardStore.addUnit(unit)).resolves.toEqual({
        _id,
        created,
        ...unit,
      })

      expect(createSpy.mock.calls).toEqual([
        [
          {
            type: CARD_TYPE.Unit,
            created,
            ...unit,
          },
        ],
      ])
      expect(dateSpy.mock.calls).toEqual([[]])
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
      CardStore['logger'] = {
        isTraceEnabled: jest.fn().mockReturnValue(true),
        trace: traceSpy,
      } as any
      const _id = new ObjectId()
      const created = new Date()
      const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => created)
      const createSpy = jest.spyOn(CardStore, 'create').mockResolvedValue({
        _id,
        created,
        ...unit,
      })

      await expect(CardStore.addUnit(unit)).resolves.toEqual({
        _id,
        created,
        ...unit,
      })

      const convertedUnit = {
        type: CARD_TYPE.Unit,
        created,
        ...unit,
      }
      expect(createSpy.mock.calls).toEqual([[convertedUnit]])
      expect(traceSpy.mock.calls).toEqual([[`Adding unit: "${JSON.stringify(convertedUnit)}"`]])
      expect(dateSpy.mock.calls).toEqual([[]])
    })
  })
})
