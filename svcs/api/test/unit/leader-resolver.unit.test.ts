import { ObjectId } from 'mongodb'

import {
  DlcDbObject,
  DlcKey,
  FactionDbObject,
  FactionKey,
  LeaderDbObject,
} from '@gwent/graphql-schema/database-typings'
import FactionStore from '../../src/database/stores/faction-store'
import LeaderResolver from '../../src/graphql/resolvers/leader-resolver'
import * as resolverUtil from '../../src/graphql/resolvers/resolver-util'

describe('leader-resolver', () => {
  describe('dlc', () => {
    it('calls out to resolveDlc method', async () => {
      const dlc: DlcDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        image: 'image',
        key: DlcKey.BloodAndWine,
        name: 'name',
      }
      const leader: LeaderDbObject = {
        ability: 'ability',
        faction: new ObjectId(),
        _id: new ObjectId(),
        created: new Date(),
        image: 'image',
        name: 'name',
        dlc: dlc._id,
        quote: 'quote',
      }
      const resolveDlcSpy = jest.spyOn(resolverUtil, 'resolveDlc').mockResolvedValue(dlc)

      await expect((LeaderResolver.dlc as any)(leader)).resolves.toEqual(dlc)

      expect(resolveDlcSpy.mock.calls).toEqual([[leader]])
    })
  })
  describe('faction', () => {
    const faction: FactionDbObject = {
      _id: new ObjectId(),
      created: new Date(),
      image: 'image',
      key: FactionKey.Monsters,
      name: 'Monsters',
      stats: {} as any,
    }
    it('does not call to FactionStore if is not ObjectId', async () => {
      const getSpy = jest.spyOn(FactionStore, 'get')

      await expect(
        (LeaderResolver.faction as any)({
          faction,
        })
      ).resolves.toEqual(faction)

      expect(getSpy.mock.calls).toEqual([])
    })
    it('calls to FactionStore if it is ObjectId', async () => {
      const getSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([faction])

      await expect(
        (LeaderResolver.faction as any)({
          faction: faction._id,
        })
      ).resolves.toEqual(faction)

      expect(getSpy.mock.calls).toEqual([
        [
          {
            ids: [faction._id],
          },
        ],
      ])
    })
  })
  describe('id', () => {
    it('returns _id as string', () => {
      const id = '000000000000000000000002'
      expect(
        (LeaderResolver.id as any)({
          _id: new ObjectId(id),
        })
      ).toEqual(id)
    })
  })
})
