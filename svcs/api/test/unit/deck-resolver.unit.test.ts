import { ObjectId } from 'mongodb'

import DeckResolver from '../../src/graphql/resolvers/deck-resolver'
import { FactionDbObject, LeaderDbObject, UnitDbObject, UserDbObject } from '@gwent/graphql-schema/database-typings'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import FactionStore from '../../src/database/stores/faction-store'
import LeaderStore from '../../src/database/stores/leader-store'
import UnitStore from '../../src/database/stores/unit-store'
import UserStore from '../../src/database/stores/user-store'

describe('deck-resolver', () => {
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
        (DeckResolver.faction as any)({
          faction,
        })
      ).resolves.toEqual(faction)

      expect(getSpy.mock.calls).toEqual([])
    })
    it('calls to FactionStore if it is ObjectId', async () => {
      const getSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([faction])

      await expect(
        (DeckResolver.faction as any)({
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
        (DeckResolver.id as any)({
          _id: new ObjectId(id),
        })
      ).toEqual(id)
    })
  })
  describe('leader', () => {
    const leader: LeaderDbObject = {
      ability: 'ability',
      _id: new ObjectId(),
      created: new Date(),
      faction: new ObjectId(),
      image: 'image',
      name: 'Monsters',
      quote: 'quote',
    }
    it('does not call to LeaderStore if is not ObjectId', async () => {
      const getSpy = jest.spyOn(LeaderStore, 'get')

      await expect(
        (DeckResolver.leader as any)({
          leader,
        })
      ).resolves.toEqual(leader)

      expect(getSpy.mock.calls).toEqual([])
    })
    it('calls to FactionStore if it is ObjectId', async () => {
      const getSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue([leader])

      await expect(
        (DeckResolver.leader as any)({
          leader: leader._id,
        })
      ).resolves.toEqual(leader)

      expect(getSpy.mock.calls).toEqual([
        [
          {
            ids: [leader._id],
          },
        ],
      ])
    })
  })
  describe('units', () => {
    const unit: UnitDbObject = {
      _id: new ObjectId(),
      created: new Date(),
      deckable: true,
      faction: new ObjectId(),
      images: [],
      name: 'name',
      quote: 'quote',
    }
    it('does not call out to UnitStore if all units resolved', async () => {
      const card = {
        artStyle: 1,
        unit,
      }
      const getSpy = jest.spyOn(UnitStore, 'get')

      await expect(
        (DeckResolver.units as any)({
          units: [card],
        })
      ).resolves.toEqual([card])

      expect(getSpy.mock.calls).toEqual([])
    })
    it('calls out to UnitStore if unit unresolved', async () => {
      const card = {
        artStyle: 1,
        unit,
      }
      const getSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue([unit])

      await expect(
        (DeckResolver.units as any)({
          units: [
            {
              id: unit._id,
              artStyle: card.artStyle,
            },
          ],
        })
      ).resolves.toEqual([card])

      expect(getSpy.mock.calls).toEqual([
        [
          {
            ids: [unit._id.toString()],
          },
        ],
      ])
    })
    it('only adds unit once when calling to UnitStore if duplicate units unresolved', async () => {
      const card = {
        artStyle: 1,
        unit,
      }
      const getSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue([unit])

      await expect(
        (DeckResolver.units as any)({
          units: [
            {
              id: unit._id,
              artStyle: card.artStyle,
            },
            {
              id: unit._id,
              artStyle: card.artStyle,
            },
          ],
        })
      ).resolves.toEqual([card, card])

      expect(getSpy.mock.calls).toEqual([
        [
          {
            ids: [unit._id.toString()],
          },
        ],
      ])
    })
    it('throws error if unit id does not exist in database', async () => {
      const card = {
        artStyle: 1,
        unit,
      }
      const getSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue([
        {
          ...unit,
          _id: new ObjectId(),
        },
      ])

      await expect(
        (DeckResolver.units as any)({
          units: [
            {
              id: unit._id,
              artStyle: card.artStyle,
            },
          ],
        })
      ).rejects.toThrow(`Could not find unit with ID "${unit._id}".`)

      expect(getSpy.mock.calls).toEqual([
        [
          {
            ids: [unit._id.toString()],
          },
        ],
      ])
    })
  })
  describe('user', () => {
    const user: UserDbObject = {
      _id: new ObjectId(),
      created: new Date(),
      name: 'name',
    }
    it('does not call to UserStore if is not ObjectId', async () => {
      const getSpy = jest.spyOn(UserStore, 'get')

      await expect(
        (DeckResolver.user as any)({
          user,
        })
      ).resolves.toEqual(user)

      expect(getSpy.mock.calls).toEqual([])
    })
    it('calls to UserStore if it is ObjectId', async () => {
      const getSpy = jest.spyOn(UserStore, 'get').mockResolvedValue(user)

      await expect(
        (DeckResolver.user as any)({
          user: user._id,
        })
      ).resolves.toEqual(user)

      expect(getSpy.mock.calls).toEqual([[user._id]])
    })
  })
})
