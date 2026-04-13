import { FieldUnitDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import GetStrongestNonHeroUnitIds from '../../src/graphql/resolvers/mutations/play-unit/get-strongest-non-hero-unit-ids'
import TestUtil from '../util/test-util'

describe('get-strongest-non-hero-unit-ids', () => {
  const logPrefix = 'log-prefix'
  it('returns empty array if fieldUnits empty array', () => {
    testGetStrongestNonHeroUnits({
      fieldUnits: [],
      logPrefix,
      units: [],
      expected: [],
    })
  })
  it('throws error if unit for fieldUnit not found', () => {
    const fieldUnit = TestUtil.getDbFieldUnit({})
    const message = `Could not find matching unit for FieldUnit "${fieldUnit.unit}"`
    testGetStrongestNonHeroUnits({
      fieldUnits: [fieldUnit],
      logPrefix,
      units: [],
      expected: Error(`${message}.`),
      errorCalls: [[`${logPrefix} failed: ${message} in units "${JSON.stringify([])}"`]],
    })
  })
  it('returns empty array if fieldUnits has no strength', () => {
    const unit = TestUtil.getDbUnit({})
    const fieldUnit = TestUtil.getDbFieldUnit({
      id: unit._id,
    })
    testGetStrongestNonHeroUnits({
      fieldUnits: [fieldUnit],
      logPrefix,
      units: [unit],
      expected: [],
      traceCalls: [[`${logPrefix} unit "${unit.name}" does not have strength, not considering for highestStrength`]],
    })
  })
  it('returns single item if it has strength', () => {
    const unit = TestUtil.getDbUnit({
      strength: 1,
    })
    const fieldUnit = TestUtil.getDbFieldUnit({
      id: unit._id,
    })
    testGetStrongestNonHeroUnits({
      fieldUnits: [fieldUnit],
      logPrefix,
      units: [unit],
      expected: [fieldUnit.unit.toString()],
      traceCalls: [
        [
          `${logPrefix} unit "${unit.name}" has higher strength "${unit.strength}" than previous "-1", setting highestStrength to it`,
        ],
        [`${logPrefix} unit "${unit.name}" matches highest strength of "${unit.strength}", adding to strongestUnitIds`],
      ],
    })
  })
  it('returns single item if it has effectiveStrength', () => {
    const unit = TestUtil.getDbUnit({
      strength: 1,
    })
    const fieldUnit = TestUtil.getDbFieldUnit({
      id: unit._id,
      effectiveStrength: 2,
    })
    testGetStrongestNonHeroUnits({
      fieldUnits: [fieldUnit],
      logPrefix,
      units: [unit],
      expected: [fieldUnit.unit.toString()],
      traceCalls: [
        [
          `${logPrefix} unit "${unit.name}" has higher strength "${fieldUnit.effectiveStrength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit.name}" matches highest strength of "${fieldUnit.effectiveStrength}", adding to strongestUnitIds`,
        ],
      ],
    })
  })
  it('effectiveStrength takes precedence over strength', () => {
    const unit1 = TestUtil.getDbUnit({
      strength: 1,
    })
    const unit2 = TestUtil.getDbUnit({
      strength: 2,
    })
    const fieldUnit1 = TestUtil.getDbFieldUnit({
      id: unit1._id,
      effectiveStrength: 3,
    })
    const fieldUnit2 = TestUtil.getDbFieldUnit({
      id: unit2._id,
    })
    testGetStrongestNonHeroUnits({
      fieldUnits: [fieldUnit1, fieldUnit2],
      logPrefix,
      units: [unit1, unit2],
      expected: [fieldUnit1.unit.toString()],
      traceCalls: [
        [
          `${logPrefix} unit "${unit1.name}" has higher strength "${fieldUnit1.effectiveStrength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit2.name}" strength "${unit2.strength}" is not greater than highestStrength of "${fieldUnit1.effectiveStrength}"`,
        ],
        [
          `${logPrefix} unit "${unit1.name}" matches highest strength of "${fieldUnit1.effectiveStrength}", adding to strongestUnitIds`,
        ],
      ],
    })
  })
  it('returns strongest of many if first', () => {
    const unit1 = TestUtil.getDbUnit({
      strength: 2,
    })
    const unit2 = TestUtil.getDbUnit({
      strength: 1,
    })
    const fieldUnit1 = TestUtil.getDbFieldUnit({
      id: unit1._id,
    })
    const fieldUnit2 = TestUtil.getDbFieldUnit({
      id: unit2._id,
    })
    testGetStrongestNonHeroUnits({
      fieldUnits: [fieldUnit1, fieldUnit2],
      logPrefix,
      units: [unit1, unit2],
      expected: [fieldUnit1.unit.toString()],
      traceCalls: [
        [
          `${logPrefix} unit "${unit1.name}" has higher strength "${unit1.strength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit2.name}" strength "${unit2.strength}" is not greater than highestStrength of "${unit1.strength}"`,
        ],
        [
          `${logPrefix} unit "${unit1.name}" matches highest strength of "${unit1.strength}", adding to strongestUnitIds`,
        ],
      ],
    })
  })
  it('returns strongest of many if last', () => {
    const unit1 = TestUtil.getDbUnit({
      strength: 1,
    })
    const unit2 = TestUtil.getDbUnit({
      strength: 2,
    })
    const fieldUnit1 = TestUtil.getDbFieldUnit({
      id: unit1._id,
    })
    const fieldUnit2 = TestUtil.getDbFieldUnit({
      id: unit2._id,
    })
    testGetStrongestNonHeroUnits({
      fieldUnits: [fieldUnit1, fieldUnit2],
      logPrefix,
      units: [unit1, unit2],
      expected: [fieldUnit2.unit.toString()],
      traceCalls: [
        [
          `${logPrefix} unit "${unit1.name}" has higher strength "${unit1.strength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit2.name}" has higher strength "${unit2.strength}" than previous "${unit1.strength}", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit2.name}" matches highest strength of "${unit2.strength}", adding to strongestUnitIds`,
        ],
      ],
    })
  })
  it('returns strongest of many if both', () => {
    const unit1 = TestUtil.getDbUnit({
      name: 'name-1',
      strength: 1,
    })
    const unit2 = TestUtil.getDbUnit({
      name: 'name-2',
      strength: 1,
    })
    const fieldUnit1 = TestUtil.getDbFieldUnit({
      id: unit1._id,
    })
    const fieldUnit2 = TestUtil.getDbFieldUnit({
      id: unit2._id,
    })
    testGetStrongestNonHeroUnits({
      fieldUnits: [fieldUnit1, fieldUnit2],
      logPrefix,
      units: [unit1, unit2],
      expected: [fieldUnit1.unit.toString(), fieldUnit2.unit.toString()],
      traceCalls: [
        [
          `${logPrefix} unit "${unit1.name}" has higher strength "${unit1.strength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit2.name}" strength "${unit2.strength}" is not greater than highestStrength of "${unit1.strength}"`,
        ],
        [
          `${logPrefix} unit "${unit1.name}" matches highest strength of "${unit1.strength}", adding to strongestUnitIds`,
        ],
        [
          `${logPrefix} unit "${unit2.name}" matches highest strength of "${unit2.strength}", adding to strongestUnitIds`,
        ],
      ],
    })
  })
  it('ignores unit if hero', () => {
    const unit = TestUtil.getDbUnit({
      strength: 1,
      hero: true,
    })
    const fieldUnit = TestUtil.getDbFieldUnit({
      id: unit._id,
    })
    testGetStrongestNonHeroUnits({
      fieldUnits: [fieldUnit],
      logPrefix,
      units: [unit],
      expected: [],
      traceCalls: [[`${logPrefix} unit "${unit.name}" is a hero, not considering for highestStrength`]],
    })
  })
  it('logs to trace if enabled', () => {
    const unit = TestUtil.getDbUnit({
      strength: 1,
    })
    const fieldUnit = TestUtil.getDbFieldUnit({
      id: unit._id,
    })
    testGetStrongestNonHeroUnits({
      fieldUnits: [fieldUnit],
      logPrefix,
      units: [unit],
      expected: [fieldUnit.unit.toString()],
      traceEnabled: true,
      traceCalls: [
        [
          `${logPrefix} unit "${unit.name}" has higher strength "${unit.strength}" than previous "-1", setting highestStrength to it`,
        ],
        [`${logPrefix} unit "${unit.name}" matches highest strength of "${unit.strength}", adding to strongestUnitIds`],
        [`${logPrefix} strongestUnitIds: "${JSON.stringify([fieldUnit.unit.toString()])}"`],
      ],
    })
  })
})

function testGetStrongestNonHeroUnits({
  fieldUnits,
  logPrefix,
  units,
  expected,
  errorCalls = [],
  traceCalls = [],
  traceEnabled,
}: {
  fieldUnits: FieldUnitDbObject[]
  logPrefix: string
  units: UnitDbObject[]
  expected?: string[] | Error
  errorCalls?: string[][]
  traceCalls?: string[][]
  traceEnabled?: boolean
}) {
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GetStrongestNonHeroUnitIds['logger'] = {
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  if (expected instanceof Error) {
    expect(() =>
      GetStrongestNonHeroUnitIds.getStrongestNonHeroUnitIds({
        fieldUnits,
        logPrefix,
        units,
      })
    ).toThrow(expected)
  } else {
    expect(
      GetStrongestNonHeroUnitIds.getStrongestNonHeroUnitIds({
        fieldUnits,
        logPrefix,
        units,
      })
    ).toEqual(expected)
  }

  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
