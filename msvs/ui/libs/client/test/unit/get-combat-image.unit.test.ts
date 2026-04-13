import {
  UnitFragmentDoc,
  Combat,
  Faction,
  FragmentType,
  Unit,
  WeatherUnitFragment,
  FieldUnitFragment,
  DeckUnitFragment,
} from '@gwent/graphql-schema/apollo-typings'
import getCombatImage from '../../src/util/get-combat-image'

describe('getCombatImage', () => {
  describe('DeckUnit', () => {
    it('returns undefined if special', () => {
      const deckUnit: DeckUnitFragment = {
        artStyle: 1,
        unit: getUnitFragment({
          special: true,
        }),
      }
      expect(getCombatImage(deckUnit)).toEqual(undefined)
    })
    it('returns first image if not special and single combat type', () => {
      const deckUnit: DeckUnitFragment = {
        artStyle: 1,
        unit: getUnitFragment({
          combats: [Combat.Close],
        }),
      }
      expect(getCombatImage(deckUnit)).toEqual('images/combats/close.png')
    })
    it('returns agile image if not special and close and ranged combat types', () => {
      const deckUnit: DeckUnitFragment = {
        artStyle: 1,
        unit: getUnitFragment({
          combats: [Combat.Close, Combat.Ranged],
        }),
      }
      expect(getCombatImage(deckUnit)).toEqual('images/combats/agile.png')
    })
    it('returns undefined if not special and close and siege combat types', () => {
      const deckUnit: DeckUnitFragment = {
        artStyle: 1,
        unit: getUnitFragment({
          combats: [Combat.Close, Combat.Siege],
        }),
      }
      expect(getCombatImage(deckUnit)).toEqual(undefined)
    })
    it('returns undefined if not special and ranged and siege combat types', () => {
      const deckUnit: DeckUnitFragment = {
        artStyle: 1,
        unit: getUnitFragment({
          combats: [Combat.Ranged, Combat.Siege],
        }),
      }
      expect(getCombatImage(deckUnit)).toEqual(undefined)
    })
    it('returns undefined if not special and all combat types', () => {
      const deckUnit: DeckUnitFragment = {
        artStyle: 1,
        unit: getUnitFragment({
          combats: [Combat.Close, Combat.Ranged, Combat.Siege],
        }),
      }
      expect(getCombatImage(deckUnit)).toEqual(undefined)
    })
  })
  describe('FieldUnit', () => {
    it('returns undefined if special', () => {
      const fieldUnit: FieldUnitFragment = {
        artStyle: 1,
        unit: getUnitFragment({
          special: true,
        }),
        effectiveStrength: 1,
        effects: [],
        row: Combat.Close,
      }
      expect(getCombatImage(fieldUnit)).toEqual(undefined)
    })
    it('returns first image if not special and single combat type', () => {
      const fieldUnit: FieldUnitFragment = {
        artStyle: 1,
        unit: getUnitFragment({
          combats: [Combat.Close],
        }),
        effectiveStrength: 1,
        effects: [],
        row: Combat.Close,
      }
      expect(getCombatImage(fieldUnit)).toEqual('images/combats/close.png')
    })
    it('returns agile image if not special and close and ranged combat types', () => {
      const fieldUnit: FieldUnitFragment = {
        artStyle: 1,
        unit: getUnitFragment({
          combats: [Combat.Close, Combat.Ranged],
        }),
        effectiveStrength: 1,
        effects: [],
        row: Combat.Close,
      }
      expect(getCombatImage(fieldUnit)).toEqual('images/combats/agile.png')
    })
    it('returns undefined if not special and close and siege combat types', () => {
      const fieldUnit: FieldUnitFragment = {
        artStyle: 1,
        unit: getUnitFragment({
          combats: [Combat.Close, Combat.Siege],
        }),
        effectiveStrength: 1,
        effects: [],
        row: Combat.Close,
      }
      expect(getCombatImage(fieldUnit)).toEqual(undefined)
    })
    it('returns undefined if not special and ranged and siege combat types', () => {
      const fieldUnit: FieldUnitFragment = {
        artStyle: 1,
        unit: getUnitFragment({
          combats: [Combat.Ranged, Combat.Siege],
        }),
        effectiveStrength: 1,
        effects: [],
        row: Combat.Close,
      }
      expect(getCombatImage(fieldUnit)).toEqual(undefined)
    })
    it('returns undefined if not special and all combat types', () => {
      const fieldUnit: FieldUnitFragment = {
        artStyle: 1,
        unit: getUnitFragment({
          combats: [Combat.Close, Combat.Ranged, Combat.Siege],
        }),
        effectiveStrength: 1,
        effects: [],
        row: Combat.Close,
      }
      expect(getCombatImage(fieldUnit)).toEqual(undefined)
    })
  })
  describe('WeatherUnit', () => {
    it('returns undefined since weatherUnit is special', () => {
      const weatherUnit: WeatherUnitFragment = {
        artStyle: 1,
        unit: getUnitFragment({
          special: true,
        }),
      }
      expect(getCombatImage(weatherUnit)).toEqual(undefined)
    })
  })
})

function getUnitFragment(overrides: Partial<Unit>): FragmentType<typeof UnitFragmentDoc> {
  const unit: Unit = {
    created: new Date(),
    deckable: true,
    faction: {} as Faction,
    id: '66ce135b901dbe02acb6b02c',
    images: ['unit-image'],
    name: 'unit-name',
    quote: 'unit-quote',
    combats: [Combat.Close, Combat.Ranged],
    modifier: false,
    ...overrides,
  }
  return unit as any as FragmentType<typeof UnitFragmentDoc>
}
