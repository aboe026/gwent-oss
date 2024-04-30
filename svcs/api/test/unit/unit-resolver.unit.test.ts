import { ObjectId } from 'mongodb'

import {
  DlcDbObject,
  DlcKey,
  EffectDbObject,
  EffectKey,
  FactionDbObject,
  FactionKey,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import * as resolverUtil from '../../src/graphql/resolvers/resolver-util'
import UnitResolver from '../../src/graphql/resolvers/unit-resolver'

describe('unit-resolver', () => {
  describe('dlc', () => {
    it('calls out to resolveDlc method', async () => {
      const dlc: DlcDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        image: 'image',
        key: DlcKey.BloodAndWine,
        name: 'name',
      }
      const unit: UnitDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        deckable: true,
        faction: new ObjectId(),
        images: [],
        name: 'name',
        quote: 'quote',
      }
      const resolveDlcSpy = jest.spyOn(resolverUtil, 'resolveDlc').mockResolvedValue(dlc)

      await expect((UnitResolver.dlc as any)(unit)).resolves.toEqual(dlc)

      expect(resolveDlcSpy.mock.calls).toEqual([[unit]])
    })
  })
  describe('effects', () => {
    it('calls out to resolveEffects method', async () => {
      const effects: EffectDbObject[] = [
        {
          _id: new ObjectId(),
          ability: 'ability',
          created: new Date(),
          image: 'image',
          key: EffectKey.Agile,
          name: 'name',
        },
      ]
      const unit: UnitDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        deckable: true,
        faction: new ObjectId(),
        images: [],
        name: 'name',
        quote: 'quote',
      }
      const resolveEffectsSpy = jest.spyOn(resolverUtil, 'resolveEffects').mockResolvedValue(effects)

      await expect((UnitResolver.effects as any)(unit)).resolves.toEqual(effects)

      expect(resolveEffectsSpy.mock.calls).toEqual([[unit]])
    })
  })
  describe('faction', () => {
    it('calls out to resolveFaction method', async () => {
      const faction: FactionDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        image: 'image',
        key: FactionKey.Monsters,
        name: 'name',
        stats: {} as any,
      }
      const unit: UnitDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        deckable: true,
        faction: new ObjectId(),
        images: [],
        name: 'name',
        quote: 'quote',
      }
      const resolveFactionSpy = jest.spyOn(resolverUtil, 'resolveFaction').mockResolvedValue(faction)

      await expect((UnitResolver.faction as any)(unit)).resolves.toEqual(faction)

      expect(resolveFactionSpy.mock.calls).toEqual([[unit]])
    })
  })
  describe('id', () => {
    it('returns _id as string', () => {
      const id = '000000000000000000000002'
      expect(
        (UnitResolver.id as any)({
          _id: new ObjectId(id),
        })
      ).toEqual(id)
    })
  })
})
