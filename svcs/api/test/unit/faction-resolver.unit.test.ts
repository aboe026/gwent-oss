import { ObjectId } from 'mongodb'

import { DlcDbObject, DlcKey, FactionDbObject, FactionKey } from '@gwent/graphql-schema/database-typings'
import FactionResolver from '../../src/graphql/resolvers/faction-resolver'
import FactionStore from '../../src/database/stores/faction-store'
import * as resolverUtil from '../../src/graphql/resolvers/resolver-util'

describe('faction-resolver', () => {
  describe('dlc', () => {
    it('calls out to resolveDlc method', async () => {
      const dlc: DlcDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        image: 'image',
        key: DlcKey.BloodAndWine,
        name: 'name',
      }
      const faction: FactionDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        image: 'image',
        key: FactionKey.Monsters,
        name: 'name',
        stats: {} as any,
        dlc: dlc._id,
      }
      const resolveDlcSpy = jest.spyOn(resolverUtil, 'resolveDlc').mockResolvedValue(dlc)

      await expect((FactionResolver.dlc as any)(faction)).resolves.toEqual(dlc)

      expect(resolveDlcSpy.mock.calls).toEqual([[faction]])
    })
  })
  describe('id', () => {
    it('returns _id as string', () => {
      const id = '000000000000000000000002'
      expect(
        (FactionResolver.id as any)({
          _id: new ObjectId(id),
        })
      ).toEqual(id)
    })
  })
  describe('stats', () => {
    it('does not call to FactionStore if neutral arg not specified', async () => {
      const faction: FactionDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        image: 'image',
        key: FactionKey.Monsters,
        name: 'name',
        stats: {
          agile: 1,
          avenger: 2,
          berserker: 3,
          bond: 4,
          close: 5,
          decoy: 6,
          heroes: 7,
          horn: 8,
          mardroeme: 9,
          medic: 10,
          morale: 11,
          muster: 12,
          ranged: 13,
          scorch: 14,
          siege: 15,
          specials: 16,
          spy: 17,
          strengthAverage: 18,
          strengths: 19,
          strengthTotal: 20,
          units: 21,
          weather: 22,
        },
      }
      const getSpy = jest.spyOn(FactionStore, 'get')

      await expect((FactionResolver.stats as any)(faction, {})).resolves.toEqual(faction.stats)

      expect(getSpy.mock.calls).toEqual([])
    })
    it('does not call to FactionStore if faction key is neutral', async () => {
      const faction: FactionDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        image: 'image',
        key: FactionKey.Neutral,
        name: 'name',
        stats: {
          agile: 1,
          avenger: 2,
          berserker: 3,
          bond: 4,
          close: 5,
          decoy: 6,
          heroes: 7,
          horn: 8,
          mardroeme: 9,
          medic: 10,
          morale: 11,
          muster: 12,
          ranged: 13,
          scorch: 14,
          siege: 15,
          specials: 16,
          spy: 17,
          strengthAverage: 18,
          strengths: 19,
          strengthTotal: 20,
          units: 21,
          weather: 22,
        },
      }
      const args = {
        neutrals: true,
      }
      const getSpy = jest.spyOn(FactionStore, 'get')

      await expect((FactionResolver.stats as any)(faction, args)).resolves.toEqual(faction.stats)

      expect(getSpy.mock.calls).toEqual([])
    })
    it('calls to FactionStore if args neutrals true and faction key is not neutral', async () => {
      const faction: FactionDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        image: 'image',
        key: FactionKey.Monsters,
        name: 'name',
        stats: {
          agile: 1,
          avenger: 2,
          berserker: 3,
          bond: 4,
          close: 5,
          decoy: 6,
          heroes: 7,
          horn: 8,
          mardroeme: 9,
          medic: 10,
          morale: 11,
          muster: 12,
          ranged: 13,
          scorch: 14,
          siege: 15,
          specials: 16,
          spy: 17,
          strengthAverage: 18,
          strengths: 19,
          strengthTotal: 20,
          units: 21,
          weather: 22,
        },
      }
      const args = {
        neutrals: true,
      }
      const neutralFaction: FactionDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        image: 'image-neutral',
        key: FactionKey.Neutral,
        name: 'name-neutral',
        stats: {
          agile: 2,
          avenger: 3,
          berserker: 4,
          bond: 5,
          close: 6,
          decoy: 7,
          heroes: 8,
          horn: 9,
          mardroeme: 10,
          medic: 11,
          morale: 12,
          muster: 13,
          ranged: 14,
          scorch: 15,
          siege: 16,
          specials: 17,
          spy: 18,
          strengthAverage: 19,
          strengths: 20,
          strengthTotal: 21,
          units: 22,
          weather: 23,
        },
      }
      const getSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([neutralFaction])

      await expect((FactionResolver.stats as any)(faction, args)).resolves.toEqual({
        agile: 3,
        avenger: 5,
        berserker: 7,
        bond: 9,
        close: 11,
        decoy: 13,
        heroes: 15,
        horn: 17,
        mardroeme: 19,
        medic: 21,
        morale: 23,
        muster: 25,
        ranged: 27,
        scorch: 29,
        siege: 31,
        specials: 33,
        spy: 35,
        strengthAverage:
          (faction.stats.strengthAverage * faction.stats.units +
            neutralFaction.stats.strengthAverage * neutralFaction.stats.units) /
          (faction.stats.units + neutralFaction.stats.units),
        strengths: 39,
        strengthTotal: 41,
        units: 43,
        weather: 45,
      })

      expect(getSpy.mock.calls).toEqual([
        [
          {
            keys: [FactionKey.Neutral],
          },
        ],
      ])
    })
  })
})
