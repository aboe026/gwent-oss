import { EffectKey } from '@gwent/graphql-schema/resolver-typings'
import getNoImpactMessage from '../../src/get-no-impact-message'

describe('getNoImpactMessage', () => {
  it('throws error if Agile', () => {
    expect(() =>
      getNoImpactMessage({
        effectKey: EffectKey.Agile,
      })
    ).toThrow(`Effect "${EffectKey.Agile}" is not impactable.`)
  })
  it('throws error if Avenger', () => {
    expect(() =>
      getNoImpactMessage({
        effectKey: EffectKey.Avenger,
      })
    ).toThrow(`Effect "${EffectKey.Avenger}" is not impactable.`)
  })
  it('throws error if Berserker', () => {
    expect(() =>
      getNoImpactMessage({
        effectKey: EffectKey.Berserker,
      })
    ).toThrow(`Effect "${EffectKey.Berserker}" is not impactable.`)
  })
  it('returns correct text for Bond', () => {
    expect(
      getNoImpactMessage({
        effectKey: EffectKey.Bond,
      })
    ).toEqual('No similar units in row to bond with.')
  })
  it('returns correct text for Horn', () => {
    expect(
      getNoImpactMessage({
        effectKey: EffectKey.Horn,
      })
    ).toEqual('No eligible units in row to strengthen.')
  })
  it('returns correct text for Mardroeme', () => {
    expect(
      getNoImpactMessage({
        effectKey: EffectKey.Mardroeme,
      })
    ).toEqual('No Berserkers in row to transform.')
  })
  it('returns correct text for Medic', () => {
    expect(
      getNoImpactMessage({
        effectKey: EffectKey.Medic,
      })
    ).toEqual('No eligible units in Lost to revive.')
  })
  it('returns correct text for Muster', () => {
    expect(
      getNoImpactMessage({
        effectKey: EffectKey.Muster,
      })
    ).toEqual('No eligible units in Draw to muster.')
  })
  it('returns correct text for Morale', () => {
    expect(
      getNoImpactMessage({
        effectKey: EffectKey.Morale,
      })
    ).toEqual('No eligible units in row to strengthen.')
  })
  it('returns correct text for Scorch', () => {
    expect(
      getNoImpactMessage({
        effectKey: EffectKey.Scorch,
      })
    ).toEqual('No eligible units on battlefield to scorch.')
  })
  it('returns correct text for Spy', () => {
    expect(
      getNoImpactMessage({
        effectKey: EffectKey.Spy,
      })
    ).toEqual('No eligible units in Draw to add to Hand.')
  })
  it('returns correct text for Weather', () => {
    expect(
      getNoImpactMessage({
        effectKey: EffectKey.Weather,
      })
    ).toEqual('No eligible units on battlefield to weaken.')
  })
})
