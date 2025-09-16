import { CardUnitFragment, DeckUnitFragment } from '@gwent/graphql-schema/apollo-typings'
import { Combat, DeckUnit, EffectKey, Unit, UnitStats } from '@gwent/graphql-schema/resolver-typings'
import GetUnitStats, { DeckUnitForValidation } from '../../src/get-unit-stats'

describe('GetUnitStats', () => {
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
  describe('fromDeckUnits', () => {
    it('calls to getUnitStats with normalized input', () => {
      const getUnitStatsSpy = jest.spyOn(GetUnitStats as any, 'getUnitStats').mockReturnValue(zeroStats)

      const deckUnits: DeckUnit[] = []
      for (let i = 0; i < 22; i++) {
        deckUnits.push({
          artStyle: i,
          unit: {
            deckable: i % 2 ? true : false,
            combats: i % 2 ? undefined : [Combat.Close],
            effects:
              i % 2
                ? undefined
                : [
                    {
                      key: EffectKey.Bond,
                    },
                  ],
            hero: i % 2 ? true : false,
            special: i % 2 ? true : false,
          } as any as Unit,
        })
      }

      expect(GetUnitStats.fromDeckUnits(deckUnits)).toEqual(zeroStats)

      expect(getUnitStatsSpy.mock.calls).toEqual([
        [
          deckUnits.map((deckUnit) => {
            return {
              combats: deckUnit.unit.combats,
              deckable: deckUnit.unit.deckable,
              effects: deckUnit.unit.effects?.map((effect) => effect.key),
              hero: deckUnit.unit.hero,
              special: deckUnit.unit.special,
              strength: deckUnit.unit.strength,
            }
          }),
        ],
      ])
    })
  })
  describe('fromDeckUnitFragments', () => {
    it('calls to getUnitStats with normalized input', () => {
      const getUnitStatsSpy = jest.spyOn(GetUnitStats as any, 'getUnitStats').mockReturnValue(zeroStats)

      const deckUnits: DeckUnitFragment[] = []
      for (let i = 0; i < 22; i++) {
        deckUnits.push({
          artStyle: i,
          unit: {
            deckable: i % 2 ? true : false,
            combats: i % 2 ? undefined : [Combat.Close],
            effects:
              i % 2
                ? undefined
                : [
                    {
                      key: EffectKey.Bond,
                    },
                  ],
            hero: i % 2 ? true : false,
            special: i % 2 ? true : false,
          } as any as CardUnitFragment,
        })
      }

      expect(GetUnitStats.fromDeckUnitFragments(deckUnits)).toEqual(zeroStats)

      expect(getUnitStatsSpy.mock.calls).toEqual([
        [
          deckUnits.map((deckUnit: any) => {
            return {
              combats: deckUnit.unit.combats,
              deckable: deckUnit.unit.deckable,
              effects: deckUnit.unit.effects?.map((effect: any) => effect.key),
              hero: deckUnit.unit.hero,
              special: deckUnit.unit.special,
              strength: deckUnit.unit.strength,
            }
          }),
        ],
      ])
    })
  })
  describe('getUnitStats', () => {
    const unit: DeckUnitForValidation = {
      combats: undefined,
      effects: undefined,
      hero: false,
      special: false,
      strength: undefined,
      deckable: true,
    }
    it('returns all zeros if no units', () => {
      expect(GetUnitStats['getUnitStats']([])).toEqual(zeroStats)
    })
    it('ignores units which are not deckable', () => {
      expect(
        GetUnitStats['getUnitStats']([
          {
            ...unit,
            deckable: false,
          },
        ])
      ).toEqual(zeroStats)
    })
    it('returns 1 for units if unit without anything', () => {
      expect(GetUnitStats['getUnitStats']([unit])).toEqual({
        ...zeroStats,
        units: 1,
      })
    })
    describe('effects', () => {
      it('returns 1 for agile if unit with agile', () => {
        expect(
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              effects: [EffectKey.Agile],
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              effects: [EffectKey.Avenger],
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              effects: [EffectKey.Berserker],
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              effects: [EffectKey.Bond],
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              effects: [EffectKey.Decoy],
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              effects: [EffectKey.Horn],
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              effects: [EffectKey.Mardroeme],
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              effects: [EffectKey.Medic],
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              effects: [EffectKey.Morale],
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              effects: [EffectKey.Muster],
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              effects: [EffectKey.Scorch],
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              effects: [EffectKey.Spy],
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              effects: [EffectKey.Weather],
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
          GetUnitStats['getUnitStats']([
            {
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
              ],
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
          GetUnitStats['getUnitStats'](
            allEffects.map((effectKey) => {
              return {
                ...unit,
                effects: [effectKey],
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              combats: [Combat.Close],
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              combats: [Combat.Ranged],
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              combats: [Combat.Siege],
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              combats: [Combat.Close, Combat.Ranged, Combat.Siege],
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              combats: [Combat.Close],
            },
            {
              ...unit,
              combats: [Combat.Ranged],
            },
            {
              ...unit,
              combats: [Combat.Siege],
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
        GetUnitStats['getUnitStats']([
          {
            ...unit,
            hero: true,
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
        GetUnitStats['getUnitStats']([
          {
            ...unit,
            special: true,
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              strength: 1,
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              strength: 2,
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              strength: 1,
            },
            {
              ...unit,
              strength: 1,
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              strength: 2,
            },
            {
              ...unit,
              strength: 2,
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
          GetUnitStats['getUnitStats']([
            {
              ...unit,
              strength: 1,
            },
            {
              ...unit,
              strength: 2,
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
