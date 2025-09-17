import { UnitFragmentDoc, Combat, Faction, FragmentType, Unit } from '@gwent/graphql-schema/apollo-typings'
import getCombatImage from '../../src/util/get-combat-image'

describe('getCombatImage', () => {
  describe('DeckUnit', () => {
    it('returns undefined if special', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: getUnitFragment({
            special: true,
          }),
        })
      ).toEqual(undefined)
    })
    it('returns first image if not special and single combat type', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: getUnitFragment({
            combats: [Combat.Close],
          }),
        })
      ).toEqual('images/combats/close.png')
    })
    it('returns agile image if not special and close and ranged combat types', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: getUnitFragment({
            combats: [Combat.Close, Combat.Ranged],
          }),
        })
      ).toEqual('images/combats/agile.png')
    })
    it('returns undefined if not special and close and siege combat types', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: getUnitFragment({
            combats: [Combat.Close, Combat.Siege],
          }),
        })
      ).toEqual(undefined)
    })
    it('returns undefined if not special and ranged and siege combat types', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: getUnitFragment({
            combats: [Combat.Ranged, Combat.Siege],
          }),
        })
      ).toEqual(undefined)
    })
    it('returns undefined if not special and all combat types', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: getUnitFragment({
            combats: [Combat.Close, Combat.Ranged, Combat.Siege],
          }),
        })
      ).toEqual(undefined)
    })
  })
  describe('GameUnit', () => {
    it('returns undefined if deckUnit is special', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: getUnitFragment({
            special: true,
          }),
          effectiveStrength: 1,
          effects: [],
          row: Combat.Close,
        })
      ).toEqual(undefined)
    })
    it('returns first image if not special and single combat type', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: getUnitFragment({
            combats: [Combat.Close],
          }),
          effectiveStrength: 1,
          effects: [],
          row: Combat.Close,
        })
      ).toEqual('images/combats/close.png')
    })
    it('returns agile image if not special and close and ranged combat types', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: getUnitFragment({
            combats: [Combat.Close, Combat.Ranged],
          }),
          effectiveStrength: 1,
          effects: [],
          row: Combat.Close,
        })
      ).toEqual('images/combats/agile.png')
    })
    it('returns undefined if not special and close and siege combat types', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: getUnitFragment({
            combats: [Combat.Close, Combat.Siege],
          }),
          effectiveStrength: 1,
          effects: [],
          row: Combat.Close,
        })
      ).toEqual(undefined)
    })
    it('returns undefined if not special and ranged and siege combat types', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: getUnitFragment({
            combats: [Combat.Ranged, Combat.Siege],
          }),
          effectiveStrength: 1,
          effects: [],
          row: Combat.Close,
        })
      ).toEqual(undefined)
    })
    it('returns undefined if not special and all combat types', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: getUnitFragment({
            combats: [Combat.Close, Combat.Ranged, Combat.Siege],
          }),
          effectiveStrength: 1,
          effects: [],
          row: Combat.Close,
        })
      ).toEqual(undefined)
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
    ...overrides,
  }
  return unit as any as FragmentType<typeof UnitFragmentDoc>
}
