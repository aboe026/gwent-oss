import { Combat, EffectKey, FactionKey, Unit, UnitStats } from '@gwent/graphql-schema/resolver-typings'
import GetUnitStats from '../../src/get-unit-stats'

describe('getUnitStats', () => {
  const unit: Unit = {
    created: new Date(),
    deckable: true,
    faction: {
      created: new Date(),
      id: 'faction-id',
      image: 'image',
      key: FactionKey.Monsters,
      name: 'faction-name',
      stats: {} as any,
    },
    id: 'id',
    images: [],
    name: 'name',
    quote: 'quote',
  }
  const zeroStats: UnitStats = {
    agile: 0,
    avenger: 0,
    berserker: 0,
    bond: 0,
    close: 0,
    decoy: 0,
    heroes: 0,
    horn: 0,
    mardroeme: 0,
    medic: 0,
    morale: 0,
    muster: 0,
    ranged: 0,
    scorch: 0,
    siege: 0,
    specials: 0,
    spy: 0,
    strengthAverage: 0,
    strengths: 0,
    strengthTotal: 0,
    units: 0,
    weather: 0,
  }
  // TODO: test private method and with and without fragments
  describe('fromDeckUnits', () => {
    it('returns all zeros if no units', () => {
      expect(GetUnitStats.fromDeckUnits([])).toEqual(zeroStats)
    })
    it('ignores units which are not deckable', () => {
      expect(
        GetUnitStats.fromDeckUnits([
          {
            artStyle: 1,
            unit: {
              ...unit,
              deckable: false,
            },
          },
        ])
      ).toEqual(zeroStats)
    })
    it('returns 1 for units if unit without anything', () => {
      expect(
        GetUnitStats.fromDeckUnits([
          {
            artStyle: 1,
            unit: unit,
          },
        ])
      ).toEqual({
        ...zeroStats,
        units: 1,
      })
    })
    describe('effects', () => {
      it('returns 1 for agile if unit with agile', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                effects: [
                  {
                    ability: 'ability',
                    created: new Date(),
                    id: 'effect-id',
                    image: 'effect-image',
                    key: EffectKey.Agile,
                    name: 'effect-name',
                  },
                ],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          agile: 1,
          units: 1,
        })
      })
      it('returns 1 for avenger if unit with avenger', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                effects: [
                  {
                    ability: 'ability',
                    created: new Date(),
                    id: 'effect-id',
                    image: 'effect-image',
                    key: EffectKey.Avenger,
                    name: 'effect-name',
                  },
                ],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          avenger: 1,
          units: 1,
        })
      })
      it('returns 1 for berserker if unit with berserker', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                effects: [
                  {
                    ability: 'ability',
                    created: new Date(),
                    id: 'effect-id',
                    image: 'effect-image',
                    key: EffectKey.Berserker,
                    name: 'effect-name',
                  },
                ],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          berserker: 1,
          units: 1,
        })
      })
      it('returns 1 for bond if unit with bond', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                effects: [
                  {
                    ability: 'ability',
                    created: new Date(),
                    id: 'effect-id',
                    image: 'effect-image',
                    key: EffectKey.Bond,
                    name: 'effect-name',
                  },
                ],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          bond: 1,
          units: 1,
        })
      })
      it('returns 1 for decoy if unit with decoy', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                effects: [
                  {
                    ability: 'ability',
                    created: new Date(),
                    id: 'effect-id',
                    image: 'effect-image',
                    key: EffectKey.Decoy,
                    name: 'effect-name',
                  },
                ],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          decoy: 1,
          units: 1,
        })
      })
      it('returns 1 for horn if unit with horn', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                effects: [
                  {
                    ability: 'ability',
                    created: new Date(),
                    id: 'effect-id',
                    image: 'effect-image',
                    key: EffectKey.Horn,
                    name: 'effect-name',
                  },
                ],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          horn: 1,
          units: 1,
        })
      })
      it('returns 1 for mardroeme if unit with mardroeme', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                effects: [
                  {
                    ability: 'ability',
                    created: new Date(),
                    id: 'effect-id',
                    image: 'effect-image',
                    key: EffectKey.Mardroeme,
                    name: 'effect-name',
                  },
                ],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          mardroeme: 1,
          units: 1,
        })
      })
      it('returns 1 for medic if unit with medic', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                effects: [
                  {
                    ability: 'ability',
                    created: new Date(),
                    id: 'effect-id',
                    image: 'effect-image',
                    key: EffectKey.Medic,
                    name: 'effect-name',
                  },
                ],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          medic: 1,
          units: 1,
        })
      })
      it('returns 1 for morale if unit with morale', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                effects: [
                  {
                    ability: 'ability',
                    created: new Date(),
                    id: 'effect-id',
                    image: 'effect-image',
                    key: EffectKey.Morale,
                    name: 'effect-name',
                  },
                ],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          morale: 1,
          units: 1,
        })
      })
      it('returns 1 for muster if unit with muster', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                effects: [
                  {
                    ability: 'ability',
                    created: new Date(),
                    id: 'effect-id',
                    image: 'effect-image',
                    key: EffectKey.Muster,
                    name: 'effect-name',
                  },
                ],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          muster: 1,
          units: 1,
        })
      })
      it('returns 1 for scorch if unit with scorch', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                effects: [
                  {
                    ability: 'ability',
                    created: new Date(),
                    id: 'effect-id',
                    image: 'effect-image',
                    key: EffectKey.Scorch,
                    name: 'effect-name',
                  },
                ],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          scorch: 1,
          units: 1,
        })
      })
      it('returns 1 for spy if unit with spy', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                effects: [
                  {
                    ability: 'ability',
                    created: new Date(),
                    id: 'effect-id',
                    image: 'effect-image',
                    key: EffectKey.Spy,
                    name: 'effect-name',
                  },
                ],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          spy: 1,
          units: 1,
        })
      })
      it('returns 1 for weather if unit with weather', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                effects: [
                  {
                    ability: 'ability',
                    created: new Date(),
                    id: 'effect-id',
                    image: 'effect-image',
                    key: EffectKey.Weather,
                    name: 'effect-name',
                  },
                ],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          weather: 1,
          units: 1,
        })
      })
      it('returns 1 for all if unit has all', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                effects: [
                  EffectKey.Agile,
                  EffectKey.Avenger,
                  EffectKey.Berserker,
                  EffectKey.Bond,
                  EffectKey.Decoy,
                  EffectKey.Horn,
                  EffectKey.Mardroeme,
                  EffectKey.Medic,
                  EffectKey.Morale,
                  EffectKey.Muster,
                  EffectKey.Scorch,
                  EffectKey.Spy,
                  EffectKey.Weather,
                ].map((key) => {
                  return {
                    ability: 'ability',
                    created: new Date(),
                    id: `effect-${key.toLocaleLowerCase()}-id`,
                    image: 'effect-image',
                    key,
                    name: 'effect-name',
                  }
                }),
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          agile: 1,
          avenger: 1,
          berserker: 1,
          bond: 1,
          decoy: 1,
          horn: 1,
          mardroeme: 1,
          medic: 1,
          morale: 1,
          muster: 1,
          scorch: 1,
          spy: 1,
          weather: 1,
          units: 1,
        })
      })
      it('returns 1 for all if units with each', () => {
        const allEffects = [
          EffectKey.Agile,
          EffectKey.Avenger,
          EffectKey.Berserker,
          EffectKey.Bond,
          EffectKey.Decoy,
          EffectKey.Horn,
          EffectKey.Mardroeme,
          EffectKey.Medic,
          EffectKey.Morale,
          EffectKey.Muster,
          EffectKey.Scorch,
          EffectKey.Spy,
          EffectKey.Weather,
        ]
        expect(
          GetUnitStats.fromDeckUnits(
            allEffects.map((effectKey) => {
              return {
                artStyle: 1,
                unit: {
                  ...unit,
                  effects: [
                    {
                      ability: 'effect-ability',
                      created: new Date(),
                      id: `effect-${effectKey.toLocaleLowerCase()}-id`,
                      image: 'effect-image',
                      key: effectKey,
                      name: 'effect-name',
                    },
                  ],
                },
              }
            })
          )
        ).toEqual({
          ...zeroStats,
          agile: 1,
          avenger: 1,
          berserker: 1,
          bond: 1,
          decoy: 1,
          horn: 1,
          mardroeme: 1,
          medic: 1,
          morale: 1,
          muster: 1,
          scorch: 1,
          spy: 1,
          weather: 1,
          units: allEffects.length,
        })
      })
    })
    describe('combats', () => {
      it('returns 1 for close if unit with close', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                combats: [Combat.Close],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          close: 1,
          units: 1,
        })
      })
      it('returns 1 for ranged if unit with ranged', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                combats: [Combat.Ranged],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          ranged: 1,
          units: 1,
        })
      })
      it('returns 1 for siege if unit with siege', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                combats: [Combat.Siege],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          siege: 1,
          units: 1,
        })
      })
      it('returns 1 for all if unit with all', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                combats: [Combat.Close, Combat.Ranged, Combat.Siege],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          close: 1,
          ranged: 1,
          siege: 1,
          units: 1,
        })
      })
      it('returns 1 for all if units with each', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                combats: [Combat.Close],
              },
            },
            {
              artStyle: 1,
              unit: {
                ...unit,
                combats: [Combat.Ranged],
              },
            },
            {
              artStyle: 1,
              unit: {
                ...unit,
                combats: [Combat.Siege],
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          close: 1,
          ranged: 1,
          siege: 1,
          units: 3,
        })
      })
    })
    it('returns 1 for heroes if unit is hero', () => {
      expect(
        GetUnitStats.fromDeckUnits([
          {
            artStyle: 1,
            unit: {
              ...unit,
              hero: true,
            },
          },
        ])
      ).toEqual({
        ...zeroStats,
        heroes: 1,
        units: 1,
      })
    })
    it('returns 1 for specials if unit is special', () => {
      expect(
        GetUnitStats.fromDeckUnits([
          {
            artStyle: 1,
            unit: {
              ...unit,
              special: true,
            },
          },
        ])
      ).toEqual({
        ...zeroStats,
        specials: 1,
        units: 1,
      })
    })
    describe('strength', () => {
      it('calculates strengths correctly for single unit with 1', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                strength: 1,
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          strengths: 1,
          strengthAverage: 1,
          strengthTotal: 1,
          units: 1,
        })
      })
      it('calculates strengths correctly for single unit with 2', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                strength: 2,
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          strengths: 1,
          strengthAverage: 2,
          strengthTotal: 2,
          units: 1,
        })
      })
      it('calculates strengths correctly for two units with 1', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                strength: 1,
              },
            },
            {
              artStyle: 1,
              unit: {
                ...unit,
                strength: 1,
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          strengths: 2,
          strengthAverage: 1,
          strengthTotal: 2,
          units: 2,
        })
      })
      it('calculates strengths correctly for two units with 2', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                strength: 2,
              },
            },
            {
              artStyle: 1,
              unit: {
                ...unit,
                strength: 2,
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          strengths: 2,
          strengthAverage: 2,
          strengthTotal: 4,
          units: 2,
        })
      })
      it('calculates strengths correctly for two units one with 1 and one with 2', () => {
        expect(
          GetUnitStats.fromDeckUnits([
            {
              artStyle: 1,
              unit: {
                ...unit,
                strength: 1,
              },
            },
            {
              artStyle: 1,
              unit: {
                ...unit,
                strength: 2,
              },
            },
          ])
        ).toEqual({
          ...zeroStats,
          strengths: 2,
          strengthAverage: 1.5,
          strengthTotal: 3,
          units: 2,
        })
      })
    })
  })
})
