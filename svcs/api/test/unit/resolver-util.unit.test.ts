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
import DlcStore from '../../src/database/stores/dlc-store'
import EffectStore from '../../src/database/stores/effect-store'
import FactionStore from '../../src/database/stores/faction-store'
import { resolveDlc, resolveEffects, resolveFaction } from '../../src/graphql/resolvers/resolver-util'

describe('resolver-util', () => {
  describe('resolveDlc', () => {
    const dlc: DlcDbObject = {
      _id: new ObjectId(),
      created: new Date(),
      image: 'image',
      key: DlcKey.BloodAndWine,
      name: 'name',
    }
    it('does not call to DlcStore if is not ObjectId', async () => {
      const getSpy = jest.spyOn(DlcStore, 'get').mockResolvedValue([dlc])

      await expect(resolveDlc({ dlc })).resolves.toEqual(dlc)

      expect(getSpy.mock.calls).toEqual([])
    })
    it('calls to DlcStore if it is ObjectId', async () => {
      const getSpy = jest.spyOn(DlcStore, 'get').mockResolvedValue([dlc])

      await expect(resolveDlc({ dlc: dlc._id })).resolves.toEqual(dlc)

      expect(getSpy.mock.calls).toEqual([
        [
          {
            ids: [dlc._id],
          },
        ],
      ])
    })
  })
  describe('resolveEffects', () => {
    it('does not call out to EffectStore if all effects resolved', async () => {
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
        effects: effects as any,
      }
      const getSpy = jest.spyOn(EffectStore, 'get')

      await expect(resolveEffects(unit)).resolves.toEqual(effects)

      expect(getSpy.mock.calls).toEqual([])
    })
    it('calls out to EffectStore if effect unresolved', async () => {
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
        effects: [effects[0]._id],
      }
      const getSpy = jest.spyOn(EffectStore, 'get').mockResolvedValue(effects)

      await expect(resolveEffects(unit)).resolves.toEqual(effects)

      expect(getSpy.mock.calls).toEqual([
        [
          {
            ids: [effects[0]._id.toString()],
          },
        ],
      ])
    })
    it('only calls to EffectStore once if multiple effects unresolved', async () => {
      const effects: EffectDbObject[] = [
        {
          _id: new ObjectId(),
          ability: 'ability',
          created: new Date(),
          image: 'image',
          key: EffectKey.Agile,
          name: 'name',
        },
        {
          _id: new ObjectId(),
          ability: 'ability-2',
          created: new Date(),
          image: 'image-2',
          key: EffectKey.Agile,
          name: 'name-2',
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
        effects: [effects[0]._id, effects[1]._id],
      }
      const getSpy = jest.spyOn(EffectStore, 'get').mockResolvedValue(effects)

      await expect(resolveEffects(unit)).resolves.toEqual(effects)

      expect(getSpy.mock.calls).toEqual([
        [
          {
            ids: [effects[0]._id.toString(), effects[1]._id.toString()],
          },
        ],
      ])
    })
    it('only adds effect once when calling to EffectStore if duplicate effects unresolved', async () => {
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
        effects: [effects[0]._id, effects[0]._id],
      }
      const getSpy = jest.spyOn(EffectStore, 'get').mockResolvedValue(effects)

      await expect(resolveEffects(unit)).resolves.toEqual([effects[0], effects[0]])

      expect(getSpy.mock.calls).toEqual([
        [
          {
            ids: [effects[0]._id.toString()],
          },
        ],
      ])
    })
    it('throws error if unit id does not exist in database', async () => {
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
        effects: [effects[0]._id],
      }
      const getSpy = jest.spyOn(EffectStore, 'get').mockResolvedValue([
        {
          ...effects[0],
          _id: new ObjectId(),
        },
      ])

      await expect(resolveEffects(unit)).rejects.toThrow(`Could not find effect with ID "${effects[0]._id}".`)

      expect(getSpy.mock.calls).toEqual([
        [
          {
            ids: [effects[0]._id.toString()],
          },
        ],
      ])
    })
  })
  describe('resolveFaction', () => {
    const faction: FactionDbObject = {
      _id: new ObjectId(),
      created: new Date(),
      image: 'image',
      key: FactionKey.Monsters,
      name: 'name',
      stats: {} as any,
    }
    it('does not call to FactionStore if is not ObjectId', async () => {
      const getSpy = jest.spyOn(DlcStore, 'get').mockResolvedValue([faction])

      await expect(resolveFaction({ faction })).resolves.toEqual(faction)

      expect(getSpy.mock.calls).toEqual([])
    })
    it('calls to FactionStore if it is ObjectId', async () => {
      const getSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([faction])

      await expect(resolveFaction({ faction: faction._id })).resolves.toEqual(faction)

      expect(getSpy.mock.calls).toEqual([
        [
          {
            ids: [faction._id],
          },
        ],
      ])
    })
  })
})
