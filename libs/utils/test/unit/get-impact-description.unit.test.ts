import { EffectKey, FactionKey, GameUnitOrigin } from '@gwent-oss/graphql-schema/resolver-typings'
import getImpactDescription from '../../src/get-impact-description'

describe('getImpactDescription', () => {
  it('throws error if both effectKey and factionKey specified', () => {
    expect(() =>
      getImpactDescription({
        effectKey: EffectKey.Agile,
        factionKey: FactionKey.Monsters,
      })
    ).toThrow(
      `Cannot get description when both effectKey (${EffectKey.Agile}) and factionKey (${FactionKey.Monsters}) specified.`
    )
  })
  describe('effectKey', () => {
    it('throws error for Agile', () => {
      expect(() =>
        getImpactDescription({
          effectKey: EffectKey.Agile,
        })
      ).toThrow(`No impact description for effect "${EffectKey.Agile}"`)
    })
    it('returns correct text for Avenger', () => {
      expect(
        getImpactDescription({
          effectKey: EffectKey.Avenger,
        })
      ).toEqual('avenged when removed from battlefield')
    })
    it('throws error for Berserker', () => {
      expect(() =>
        getImpactDescription({
          effectKey: EffectKey.Berserker,
        })
      ).toThrow(`No impact description for effect "${EffectKey.Berserker}"`)
    })
    it('throws error if Mardroeme and no name', () => {
      expect(() =>
        getImpactDescription({
          effectKey: EffectKey.Mardroeme,
        })
      ).toThrow(`Must specify name for "${EffectKey.Mardroeme}" impact.`)
    })
    it('returns correct text for Bond', () => {
      expect(
        getImpactDescription({
          effectKey: EffectKey.Bond,
        })
      ).toEqual('bonded in strength')
    })
    it('returns correct text for Decoy', () => {
      expect(
        getImpactDescription({
          effectKey: EffectKey.Decoy,
        })
      ).toEqual('decoyed from battlefield')
    })
    it('returns correct text for Horn', () => {
      expect(
        getImpactDescription({
          effectKey: EffectKey.Horn,
        })
      ).toEqual("strengthened by Commander's Horn")
    })
    it('returns correct text for Mardroeme of Young Berserker', () => {
      expect(
        getImpactDescription({
          effectKey: EffectKey.Mardroeme,
          name: 'Young Berserker',
        })
      ).toEqual('transformed by Mardroeme into Transformed Young Vildkaarl')
    })
    it('returns correct text for Mardroeme of Berserker', () => {
      expect(
        getImpactDescription({
          effectKey: EffectKey.Mardroeme,
          name: 'Berserker',
        })
      ).toEqual('transformed by Mardroeme into Transformed Vildkaarl')
    })
    it('returns correct text for Medic', () => {
      expect(
        getImpactDescription({
          effectKey: EffectKey.Medic,
        })
      ).toEqual('revived by Medic')
    })
    it('returns correct text for Morale', () => {
      expect(
        getImpactDescription({
          effectKey: EffectKey.Morale,
        })
      ).toEqual('moraled in strength')
    })
    it('throws error if Muster with no origin', () => {
      expect(() =>
        getImpactDescription({
          effectKey: EffectKey.Muster,
        })
      ).toThrow(
        `Invalid source "undefined" for "${EffectKey.Muster}" impact. Must be either "${GameUnitOrigin.Hand}" or "${GameUnitOrigin.Undrawn}".`
      )
    })
    it('throws error if Muster with Discard origin', () => {
      expect(() =>
        getImpactDescription({
          effectKey: EffectKey.Muster,
          origin: GameUnitOrigin.Discard,
        })
      ).toThrow(
        `Invalid source "${GameUnitOrigin.Discard}" for "${EffectKey.Muster}" impact. Must be either "${GameUnitOrigin.Hand}" or "${GameUnitOrigin.Undrawn}".`
      )
    })
    it('throws error if Muster with Opponent origin', () => {
      expect(() =>
        getImpactDescription({
          effectKey: EffectKey.Muster,
          origin: GameUnitOrigin.Opponent,
        })
      ).toThrow(
        `Invalid source "${GameUnitOrigin.Opponent}" for "${EffectKey.Muster}" impact. Must be either "${GameUnitOrigin.Hand}" or "${GameUnitOrigin.Undrawn}".`
      )
    })
    it('returns correct text for Muster with Hand origin', () => {
      expect(
        getImpactDescription({
          effectKey: EffectKey.Muster,
          origin: GameUnitOrigin.Hand,
        })
      ).toEqual('mustered from Hand')
    })
    it('returns correct text for Muster with Undrawn origin', () => {
      expect(
        getImpactDescription({
          effectKey: EffectKey.Muster,
          origin: GameUnitOrigin.Undrawn,
        })
      ).toEqual('mustered from Draw pile')
    })
    it('returns correct text for Scorch', () => {
      expect(
        getImpactDescription({
          effectKey: EffectKey.Scorch,
        })
      ).toEqual('scorched from battlefield')
    })
    it('returns correct text for Spy', () => {
      expect(
        getImpactDescription({
          effectKey: EffectKey.Spy,
        })
      ).toEqual('spied from undrawn into hand')
    })
    it('returns correct text for Weather', () => {
      expect(
        getImpactDescription({
          effectKey: EffectKey.Weather,
        })
      ).toEqual('weathered in battlefield')
    })
  })
  describe('factionKey', () => {
    it('returns correct text for Monsters', () => {
      expect(
        getImpactDescription({
          factionKey: FactionKey.Monsters,
        })
      ).toEqual('remained on battlefield from last round')
    })
    it('returns correct text for Nilfgaardian Empire', () => {
      expect(
        getImpactDescription({
          factionKey: FactionKey.NilfgaardianEmpire,
        })
      ).toEqual('won the round instead of sharing a draw')
    })
    it('returns correct text for Northern Realms', () => {
      expect(
        getImpactDescription({
          factionKey: FactionKey.NorthernRealms,
        })
      ).toEqual('handed from draw pile')
    })
    it('throws error if index not specified for ScoiaTael', () => {
      expect(() =>
        getImpactDescription({
          factionKey: FactionKey.ScoiaTael,
        })
      ).toThrow(`Index required for Scoia'Tael faction description`)
    })
    it('returns correct text for ScoiaTael when index of 0 provided', () => {
      expect(
        getImpactDescription({
          factionKey: FactionKey.ScoiaTael,
          index: 0,
        })
      ).toEqual('ordered as 1st player to take turn on game')
    })
    it('returns correct text for ScoiaTael when index of 1 provided', () => {
      expect(
        getImpactDescription({
          factionKey: FactionKey.ScoiaTael,
          index: 1,
        })
      ).toEqual('ordered as 2nd player to take turn on game')
    })
    it('returns correct text for Skellige', () => {
      expect(
        getImpactDescription({
          factionKey: FactionKey.Skellige,
        })
      ).toEqual('fielded from lost pile')
    })
  })
})
