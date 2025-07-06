import { EffectKey } from '@gwent/graphql-schema/resolver-typings'
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
  it('returns correct text for Mardroeme', () => {
    expect(
      getImpactDescription({
        effectKey: EffectKey.Mardroeme,
      })
    ).toEqual('transformed by Mardroeme')
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
  it('returns correct text for Muster', () => {
    expect(
      getImpactDescription({
        effectKey: EffectKey.Muster,
      })
    ).toEqual('mustered to battlefield')
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
