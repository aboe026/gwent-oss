import { Combat, Faction, Unit } from '@gwent/graphql-schema/resolver-typings'
import getCombatImage from '../../src/get-combat-image'

describe('getCombatImage', () => {
  const unit: Unit = {
    created: new Date(),
    deckable: true,
    faction: {} as Faction,
    id: '66ce135b901dbe02acb6b02c',
    images: ['unit-image'],
    name: 'unit-name',
    quote: 'unit-quote',
    combats: [Combat.Close, Combat.Ranged],
  }
  describe('DeckUnit', () => {
    it('returns undefined if special', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: {
            ...unit,
            special: true,
          },
        })
      ).toEqual(undefined)
    })
    it('returns first image if not special and single combat type', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: {
            ...unit,
            combats: [Combat.Close],
          },
        })
      ).toEqual('images/combats/close.png')
    })
    it('returns agile image if not special and close and ranged combat types', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: {
            ...unit,
            combats: [Combat.Close, Combat.Ranged],
          },
        })
      ).toEqual('images/combats/agile.png')
    })
    it('returns undefined if not special and close and siege combat types', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: {
            ...unit,
            combats: [Combat.Close, Combat.Siege],
          },
        })
      ).toEqual(undefined)
    })
    it('returns undefined if not special and ranged and siege combat types', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: {
            ...unit,
            combats: [Combat.Ranged, Combat.Siege],
          },
        })
      ).toEqual(undefined)
    })
    it('returns undefined if not special and all combat types', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: {
            ...unit,
            combats: [Combat.Close, Combat.Ranged, Combat.Siege],
          },
        })
      ).toEqual(undefined)
    })
  })
  describe('GameUnit', () => {
    it('returns undefined if deckUnit is special', () => {
      expect(
        getCombatImage({
          artStyle: 1,
          unit: {
            ...unit,
            special: true,
          },
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
          unit: {
            ...unit,
            combats: [Combat.Close],
          },
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
          unit: {
            ...unit,
            combats: [Combat.Close, Combat.Ranged],
          },
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
          unit: {
            ...unit,
            combats: [Combat.Close, Combat.Siege],
          },
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
          unit: {
            ...unit,
            combats: [Combat.Ranged, Combat.Siege],
          },
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
          unit: {
            ...unit,
            combats: [Combat.Close, Combat.Ranged, Combat.Siege],
          },
          effectiveStrength: 1,
          effects: [],
          row: Combat.Close,
        })
      ).toEqual(undefined)
    })
  })
})
