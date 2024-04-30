import { ObjectId } from 'mongodb'

import { Combat, EffectDbObject, EffectKey, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import EffectStore, { GetEffectsInput } from '../../src/database/stores/effect-store'

describe('effect-store', () => {
  describe('add', () => {
    it('calls to create', async () => {
      await testAdd({})
    })
    it('calls to create with trace enabled', async () => {
      await testAdd({
        traceEnabled: true,
      })
    })
  })
  describe('get', () => {
    it('calls to read with empty filter if no ids or keys', async () => {
      await testGet({
        input: {},
        expectedFilter: {},
      })
    })
    it('calls to read with ids filter if only string ids supplied', async () => {
      const id = new ObjectId()
      await testGet({
        input: {
          ids: [id.toString()],
        },
        expectedFilter: {
          _id: {
            $in: [id],
          },
        },
      })
    })
    it('calls to read with ids filter if only ObjectId ids supplied', async () => {
      const id = new ObjectId()
      await testGet({
        input: {
          ids: [id],
        },
        expectedFilter: {
          _id: {
            $in: [id],
          },
        },
      })
    })
    it('calls to read with keys filter if only keys supplied', async () => {
      const key = EffectKey.Agile
      await testGet({
        input: {
          keys: [key],
        },
        expectedFilter: {
          key: {
            $in: [key],
          },
        },
      })
    })
    it('calls to read with ids and keys filter if both supplied', async () => {
      const id = new ObjectId()
      const key = EffectKey.Agile
      await testGet({
        input: {
          ids: [id],
          keys: [key],
        },
        expectedFilter: {
          _id: {
            $in: [id],
          },
          key: {
            $in: [key],
          },
        },
      })
    })
  })
  describe('resolveAbilitiesForUnit', () => {
    it('does nothing if effects is empty array', () => {
      const unit: UnitDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        deckable: true,
        faction: new ObjectId(),
        images: [],
        name: 'name',
        quote: 'quote',
        effects: [],
      }
      const effects: EffectDbObject[] = []

      expect(EffectStore.resolveAbilitiesForUnit(unit, effects)).toEqual([])
    })
    it('does not modify abilities if unit does not have combats or effect prefix', () => {
      testresolveAbilitiesForUnit({})
    })
    it('modifies weather ability if unit has single combat', () => {
      testresolveAbilitiesForUnit({
        combats: [Combat.Close],
        expectedWeatherAbility:
          'Reduce the strength of all cards in the Close row on the battlefield, including your own.',
      })
    })
    it('modifies weather ability if unit has multiple combats', () => {
      testresolveAbilitiesForUnit({
        combats: [Combat.Close, Combat.Ranged],
        expectedWeatherAbility:
          'Reduce the strength of all cards in the Close and Ranged rows on the battlefield, including your own.',
      })
    })
    it('modifies muster ability if unit has effectPrefix', () => {
      testresolveAbilitiesForUnit({
        effectPrefix: 'Arachas',
        expectedMusterAbility: 'Find any cards with the "Arachas" prefix in your deck and play them instantly.',
      })
    })
    it('modifies weather and muster abilities if unit has combats and effectPrefix', () => {
      testresolveAbilitiesForUnit({
        combats: [Combat.Close, Combat.Ranged],
        effectPrefix: 'Arachas',
        expectedMusterAbility: 'Find any cards with the "Arachas" prefix in your deck and play them instantly.',
        expectedWeatherAbility:
          'Reduce the strength of all cards in the Close and Ranged rows on the battlefield, including your own.',
      })
    })
    it('does not overwrite effect abilities', () => {
      const unit1: UnitDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        deckable: true,
        faction: new ObjectId(),
        images: [],
        name: 'name',
        quote: 'quote',
        effects: [],
        effectPrefix: 'Arachas',
      }
      const unit2 = {
        _id: new ObjectId(),
        created: new Date(),
        deckable: true,
        faction: new ObjectId(),
        images: [],
        name: 'name',
        quote: 'quote',
        effects: [],
        effectPrefix: 'Crone',
      }
      const effects: EffectDbObject[] = [
        {
          _id: new ObjectId(),
          ability: 'Reduce the strength of all cards in the given row(s) on the battlefield, including your own.',
          created: new Date(),
          image: 'image',
          key: EffectKey.Weather,
          name: 'name',
        },
        {
          _id: new ObjectId(),
          ability: 'Find any cards with the same name in your deck and play them instantly.',
          created: new Date(),
          image: 'image',
          key: EffectKey.Muster,
          name: 'name',
        },
      ]

      expect(EffectStore.resolveAbilitiesForUnit(unit1, effects)).toEqual([
        effects[0],
        {
          ...effects[1],
          ability: 'Find any cards with the "Arachas" prefix in your deck and play them instantly.',
        },
      ])
      expect(EffectStore.resolveAbilitiesForUnit(unit2, effects)).toEqual([
        effects[0],
        {
          ...effects[1],
          ability: 'Find any cards with the "Crone" prefix in your deck and play them instantly.',
        },
      ])
    })
  })
})

async function testAdd({ traceEnabled }: { traceEnabled?: boolean }) {
  const ability = 'ability'
  const created = new Date()
  const image = 'image'
  const key = EffectKey.Agile
  const name = 'name'
  const expected: EffectDbObject = {
    _id: new ObjectId(),
    ability,
    created,
    image,
    key,
    name,
  }
  const createSpy = jest.spyOn(EffectStore as any, 'create').mockResolvedValue(expected)
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => created)
  const traceSpy = jest.fn().mockImplementation()
  EffectStore['logger'] = {
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(
    EffectStore.add({
      ability,
      image,
      key,
      name,
    })
  ).resolves.toEqual(expected)

  expect(createSpy.mock.calls).toEqual([
    [
      {
        ability,
        created,
        image,
        key,
        name,
      },
    ],
  ])
  expect(dateSpy.mock.calls).toEqual([[]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`Adding effect: "${JSON.stringify({ ability, created, image, key, name })}"`]] : []
  )
}

// eslint-disable-next-line @typescript-eslint/ban-types
async function testGet({ expectedFilter, input }: { expectedFilter: Object; input: GetEffectsInput }) {
  const readSpy = jest.spyOn(EffectStore as any, 'read').mockResolvedValue([])

  await expect(EffectStore.get(input)).resolves.toEqual([])

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter: expectedFilter,
      },
    ],
  ])
}

function testresolveAbilitiesForUnit({
  combats,
  effectPrefix,
  expectedMusterAbility = 'Find any cards with the same name in your deck and play them instantly.',
  expectedWeatherAbility = 'Reduce the strength of all cards in the given row(s) on the battlefield, including your own.',
}: {
  combats?: Combat[]
  effectPrefix?: string
  expectedWeatherAbility?: string
  expectedMusterAbility?: string
}) {
  const unit: UnitDbObject = {
    _id: new ObjectId(),
    created: new Date(),
    deckable: true,
    faction: new ObjectId(),
    images: [],
    name: 'name',
    quote: 'quote',
    effects: [],
    combats,
    effectPrefix,
  }
  const effects: EffectDbObject[] = [
    {
      _id: new ObjectId(),
      ability: 'Reduce the strength of all cards in the given row(s) on the battlefield, including your own.',
      created: new Date(),
      image: 'image',
      key: EffectKey.Weather,
      name: 'name',
    },
    {
      _id: new ObjectId(),
      ability: 'Find any cards with the same name in your deck and play them instantly.',
      created: new Date(),
      image: 'image',
      key: EffectKey.Muster,
      name: 'name',
    },
  ]

  expect(EffectStore.resolveAbilitiesForUnit(unit, effects)).toEqual([
    {
      ...effects[0],
      ability: expectedWeatherAbility,
    },
    {
      ...effects[1],
      ability: expectedMusterAbility,
    },
  ])
}
