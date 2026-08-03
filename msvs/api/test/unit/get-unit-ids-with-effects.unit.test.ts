import { ObjectId } from 'mongodb'

import { EffectDbObject, UnitDbObject } from '@gwent-oss/graphql-schema/database-typings'
import getUnitIdsWithEffect from '../../src/graphql/resolvers/mutations/play-unit/get-unit-ids-with-effect'
import TestUtil from '../util/test-util'

describe('get-unit-ids-with-effects', () => {
  describe('getUnitIdsWithEffect', () => {
    const effect = TestUtil.getDbEffect({})
    it('returns empty array if no units', () => {
      testGetUnitIdsWithEffect({
        effect,
        units: [],
        expected: [],
      })
    })
    it('returns empty array if effect undefined', () => {
      const unit = TestUtil.getDbUnit({
        effects: [effect._id],
      })
      testGetUnitIdsWithEffect({
        effect: undefined,
        units: [unit],
        expected: [],
      })
    })
    it('returns empty array if unit does not have effects', () => {
      const unit = TestUtil.getDbUnit({})
      testGetUnitIdsWithEffect({
        effect,
        units: [unit],
        expected: [],
      })
    })
    it('returns empty array if unit effect does not match effect', () => {
      const unit = TestUtil.getDbUnit({
        effects: [new ObjectId()],
      })
      testGetUnitIdsWithEffect({
        effect,
        units: [unit],
        expected: [],
      })
    })
    it('returns single id if unit with single effect', () => {
      const unit = TestUtil.getDbUnit({
        effects: [effect._id],
      })
      testGetUnitIdsWithEffect({
        effect,
        units: [unit],
        expected: [unit._id.toString()],
      })
    })
    it('returns single id if unit with one of many effects', () => {
      const unit = TestUtil.getDbUnit({
        effects: [new ObjectId(), effect._id, new ObjectId()],
      })
      testGetUnitIdsWithEffect({
        effect,
        units: [unit],
        expected: [unit._id.toString()],
      })
    })
    it('returns single id if unit one of many with single effect', () => {
      const unit = TestUtil.getDbUnit({
        effects: [effect._id],
      })
      testGetUnitIdsWithEffect({
        effect,
        units: [TestUtil.getDbUnit({}), unit, TestUtil.getDbUnit({})],
        expected: [unit._id.toString()],
      })
    })
    it('returns multiple ids if multiple units with single effect', () => {
      const unit1 = TestUtil.getDbUnit({
        effects: [effect._id],
      })
      const unit2 = TestUtil.getDbUnit({
        effects: [effect._id],
      })
      testGetUnitIdsWithEffect({
        effect,
        units: [unit1, unit2],
        expected: [unit1._id.toString(), unit2._id.toString()],
      })
    })
    it('returns multiple ids if multiple units with one of many effects', () => {
      const unit1 = TestUtil.getDbUnit({
        effects: [effect._id, new ObjectId()],
      })
      const unit2 = TestUtil.getDbUnit({
        effects: [new ObjectId(), effect._id],
      })
      testGetUnitIdsWithEffect({
        effect,
        units: [unit1, unit2],
        expected: [unit1._id.toString(), unit2._id.toString()],
      })
    })
    it('returns multiple ids if multiple of many units with single effect', () => {
      const unit1 = TestUtil.getDbUnit({
        effects: [effect._id],
      })
      const unit2 = TestUtil.getDbUnit({
        effects: [effect._id],
      })
      testGetUnitIdsWithEffect({
        effect,
        units: [TestUtil.getDbUnit({}), unit1, TestUtil.getDbUnit({}), unit2, TestUtil.getDbUnit({})],
        expected: [unit1._id.toString(), unit2._id.toString()],
      })
    })
  })
})

function testGetUnitIdsWithEffect({
  effect,
  units,
  expected,
}: {
  effect: EffectDbObject | undefined
  units: UnitDbObject[]
  expected: string[]
}) {
  expect(
    getUnitIdsWithEffect({
      effect,
      units,
    })
  ).toEqual(expected)
}
