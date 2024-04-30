import { ObjectId } from 'mongodb'

import AppInfo from '../../src/app-info'
import DeckStore from '../../src/database/stores/deck-store'
import * as env from '../../src/env'
import { FactionKey, SettingKey, SettingType } from '@gwent/graphql-schema/resolver-typings'
import FactionStore from '../../src/database/stores/faction-store'
import LeaderStore from '../../src/database/stores/leader-store'
import QueryResolver from '../../src/graphql/resolvers/query-resolver'
import UnitStore from '../../src/database/stores/unit-store'
import { version } from '../../package.json'

describe('query-resolver', () => {
  describe('application', () => {
    it('calls out to AppInfo to get build number', async () => {
      const build = 3
      const getBuildNumberSpy = jest.spyOn(AppInfo, 'getBuildNumber').mockResolvedValue(build)

      await expect((QueryResolver.application as any)()).resolves.toEqual({
        build,
        version,
      })

      expect(getBuildNumberSpy.mock.calls).toEqual([[]])
    })
  })
  describe('currentUser', () => {
    it('throws error if context undefined', () => {
      const context = undefined
      expect(() => (QueryResolver.currentUser as any)(null, null, context, null)).toThrow('No user on session')
    })
    it('throws error if session undefined', () => {
      const context = {}
      expect(() => (QueryResolver.currentUser as any)(null, null, context, null)).toThrow('No user on session')
    })
    it('throws error if user undefined', () => {
      const context = {
        session: {},
      }
      expect(() => (QueryResolver.currentUser as any)(null, null, context, null)).toThrow('No user on session')
    })
    it('returns user if defined on session', () => {
      const user = {
        _id: new ObjectId(),
      }
      const context = {
        session: {
          user,
        },
      }
      expect((QueryResolver.currentUser as any)(null, null, context, null)).toEqual(user)
    })
  })
  describe('decks', () => {
    it('reaches out to DeckStore with user on session', async () => {
      const context = {
        session: {
          user: {
            _id: new ObjectId(),
          },
        },
      }
      const getSpy = jest.spyOn(DeckStore, 'get').mockResolvedValue([])

      await expect((QueryResolver.decks as any)(null, null, context, null)).resolves.toEqual([])

      expect(getSpy.mock.calls).toEqual([[context.session.user._id]])
    })
  })
  describe('factions', () => {
    it('reaches out to FactionStore', async () => {
      const getSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([])

      await expect((QueryResolver.factions as any)(null, null, null, null)).resolves.toEqual([])

      expect(getSpy.mock.calls).toEqual([[{}]])
    })
  })
  describe('leaders', () => {
    it('does not reach out to FactionStore if no factions in args', async () => {
      const args = {}
      const factionGetSpy = jest.spyOn(FactionStore, 'get')
      const leaderGetSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue([])

      await expect((QueryResolver.leaders as any)(null, args, null, null)).resolves.toEqual([])

      expect(factionGetSpy.mock.calls).toEqual([])
      expect(leaderGetSpy.mock.calls).toEqual([
        [
          {
            factionIds: undefined,
          },
        ],
      ])
    })
    it('reaches out to get faction ids if single faction in args', async () => {
      const factionKey = FactionKey.Monsters
      const factionId = new ObjectId()
      const args = {
        factions: [factionKey],
      }
      const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([
        {
          _id: factionId,
        } as any,
      ])
      const leaderGetSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue([])

      await expect((QueryResolver.leaders as any)(null, args, null, null)).resolves.toEqual([])

      expect(factionGetSpy.mock.calls).toEqual([
        [
          {
            keys: [factionKey],
          },
        ],
      ])
      expect(leaderGetSpy.mock.calls).toEqual([
        [
          {
            factionIds: [factionId],
          },
        ],
      ])
    })
    it('reaches out to get faction ids if multiple factions in args', async () => {
      const factionKey1 = FactionKey.Monsters
      const factionKey2 = FactionKey.ScoiaTael
      const factionId1 = new ObjectId()
      const factionId2 = new ObjectId()
      const args = {
        factions: [factionKey1, factionKey2],
      }
      const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([
        {
          _id: factionId1,
        } as any,
        {
          _id: factionId2,
        } as any,
      ])
      const leaderGetSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue([])

      await expect((QueryResolver.leaders as any)(null, args, null, null)).resolves.toEqual([])

      expect(factionGetSpy.mock.calls).toEqual([
        [
          {
            keys: [factionKey1, factionKey2],
          },
        ],
      ])
      expect(leaderGetSpy.mock.calls).toEqual([
        [
          {
            factionIds: [factionId1, factionId2],
          },
        ],
      ])
    })
  })
  describe('settings', () => {
    it('returns settings with values from env', () => {
      const sessionTimeout = 30
      jest.spyOn(env, 'default').mockReturnValue({
        SESSION_TIMEOUT_SECONDS: sessionTimeout,
      } as any)

      expect((QueryResolver.settings as any)()).toEqual([
        {
          key: SettingKey.SessionTimeoutSeconds,
          type: SettingType.Number,
          label: 'Session Timeout (seconds)',
          value: sessionTimeout.toString(),
        },
      ])
    })
  })
  describe('units', () => {
    it('does not call out to FactionStore if no factions in args', async () => {
      const args = {}
      const factionGetSpy = jest.spyOn(FactionStore, 'get')
      const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue([])

      await expect((QueryResolver.units as any)(null, args, null, null)).resolves.toEqual([])

      expect(factionGetSpy.mock.calls).toEqual([])
      expect(unitGetSpy.mock.calls).toEqual([
        [
          {
            deckable: undefined,
            factionIds: undefined,
          },
        ],
      ])
    })
    it('calls out to FactionStore if factions in args', async () => {
      const factionKey = FactionKey.NorthernRealms
      const factionId = new ObjectId()
      const args = {
        factions: [factionKey],
      }
      const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([
        {
          _id: factionId,
        } as any,
      ])
      const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue([])

      await expect((QueryResolver.units as any)(null, args, null, null)).resolves.toEqual([])

      expect(factionGetSpy.mock.calls).toEqual([
        [
          {
            keys: [factionKey],
          },
        ],
      ])
      expect(unitGetSpy.mock.calls).toEqual([
        [
          {
            deckable: undefined,
            factionIds: [factionId],
          },
        ],
      ])
    })
    it('passes deckable false to UnitStore if explicitly defined in args', async () => {
      const args = {
        deckable: false,
      }
      const factionGetSpy = jest.spyOn(FactionStore, 'get')
      const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue([])

      await expect((QueryResolver.units as any)(null, args, null, null)).resolves.toEqual([])

      expect(factionGetSpy.mock.calls).toEqual([])
      expect(unitGetSpy.mock.calls).toEqual([
        [
          {
            deckable: false,
            factionIds: undefined,
          },
        ],
      ])
    })
    it('passes deckable true to UnitStore if explicitly defined in args', async () => {
      const args = {
        deckable: true,
      }
      const factionGetSpy = jest.spyOn(FactionStore, 'get')
      const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue([])

      await expect((QueryResolver.units as any)(null, args, null, null)).resolves.toEqual([])

      expect(factionGetSpy.mock.calls).toEqual([])
      expect(unitGetSpy.mock.calls).toEqual([
        [
          {
            deckable: true,
            factionIds: undefined,
          },
        ],
      ])
    })
  })
})
