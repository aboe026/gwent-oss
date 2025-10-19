import { EffectKey, GameUnitOrigin } from '@gwent/graphql-schema/resolver-typings'
import getImpactDescription from '../../src/get-impact-description'

describe('getImpactDescription', () => {
  it('throws error for Agile', () => {
    expect(() =>
      getImpactDescription({
        effectKey: EffectKey.Agile,
      })
    ).toThrow(`No impact description for effect "${EffectKey.Agile}"`)
  })
  it('throws error for Avenger', () => {
    expect(() =>
      getImpactDescription({
        effectKey: EffectKey.Avenger,
      })
    ).toThrow(`No impact description for effect "${EffectKey.Avenger}"`)
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
    ).toEqual('spied into battlefield')
  })
  it('returns correct text for Weather', () => {
    expect(
      getImpactDescription({
        effectKey: EffectKey.Weather,
      })
    ).toEqual('weathered in battlefield')
  })
})
