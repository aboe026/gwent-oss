import { GameUnitDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import GetStrongestNonHeroUnitIds from '../../src/graphql/resolvers/mutations/play-unit/get-strongest-non-hero-unit-ids'
import TestUtil from '../util/test-util'

describe('get-strongest-non-hero-unit-ids', () => {
  const logPrefix = 'log-prefix'
  it('returns empty array if gameUnits empty array', () => {
    testGetStrongestNonHeroUnits({
      gameUnits: [],
      logPrefix,
      units: [],
      expected: [],
    })
  })
  it('throws error if unit for gameUnit not found', () => {
    const gameUnit = TestUtil.getDbGameUnit({})
    const message = `Could not find matching unit for game unit "${gameUnit.unit}"`
    testGetStrongestNonHeroUnits({
      gameUnits: [gameUnit],
      logPrefix,
      units: [],
      expected: Error(`${message}.`),
      errorCalls: [[`${logPrefix} failed: ${message} in units "${JSON.stringify([])}"`]],
    })
  })
  it('returns empty array if gameUnits has no strength', () => {
    const unit = TestUtil.getDbUnit({})
    const gameUnit = TestUtil.getDbGameUnit({
      id: unit._id,
    })
    testGetStrongestNonHeroUnits({
      gameUnits: [gameUnit],
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
    const gameUnit = TestUtil.getDbGameUnit({
      id: unit._id,
    })
    testGetStrongestNonHeroUnits({
      gameUnits: [gameUnit],
      logPrefix,
      units: [unit],
      expected: [gameUnit.unit.toString()],
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
    const gameUnit = TestUtil.getDbGameUnit({
      id: unit._id,
      effectiveStrength: 2,
    })
    testGetStrongestNonHeroUnits({
      gameUnits: [gameUnit],
      logPrefix,
      units: [unit],
      expected: [gameUnit.unit.toString()],
      traceCalls: [
        [
          `${logPrefix} unit "${unit.name}" has higher strength "${gameUnit.effectiveStrength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit.name}" matches highest strength of "${gameUnit.effectiveStrength}", adding to strongestUnitIds`,
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
    const gameUnit1 = TestUtil.getDbGameUnit({
      id: unit1._id,
      effectiveStrength: 3,
    })
    const gameUnit2 = TestUtil.getDbGameUnit({
      id: unit2._id,
    })
    testGetStrongestNonHeroUnits({
      gameUnits: [gameUnit1, gameUnit2],
      logPrefix,
      units: [unit1, unit2],
      expected: [gameUnit1.unit.toString()],
      traceCalls: [
        [
          `${logPrefix} unit "${unit1.name}" has higher strength "${gameUnit1.effectiveStrength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit2.name}" strength "${unit2.strength}" is not greater than highestStrength of "${gameUnit1.effectiveStrength}"`,
        ],
        [
          `${logPrefix} unit "${unit1.name}" matches highest strength of "${gameUnit1.effectiveStrength}", adding to strongestUnitIds`,
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
    const gameUnit1 = TestUtil.getDbGameUnit({
      id: unit1._id,
    })
    const gameUnit2 = TestUtil.getDbGameUnit({
      id: unit2._id,
    })
    testGetStrongestNonHeroUnits({
      gameUnits: [gameUnit1, gameUnit2],
      logPrefix,
      units: [unit1, unit2],
      expected: [gameUnit1.unit.toString()],
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
    const gameUnit1 = TestUtil.getDbGameUnit({
      id: unit1._id,
    })
    const gameUnit2 = TestUtil.getDbGameUnit({
      id: unit2._id,
    })
    testGetStrongestNonHeroUnits({
      gameUnits: [gameUnit1, gameUnit2],
      logPrefix,
      units: [unit1, unit2],
      expected: [gameUnit2.unit.toString()],
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
    const gameUnit1 = TestUtil.getDbGameUnit({
      id: unit1._id,
    })
    const gameUnit2 = TestUtil.getDbGameUnit({
      id: unit2._id,
    })
    testGetStrongestNonHeroUnits({
      gameUnits: [gameUnit1, gameUnit2],
      logPrefix,
      units: [unit1, unit2],
      expected: [gameUnit1.unit.toString(), gameUnit2.unit.toString()],
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
    const gameUnit = TestUtil.getDbGameUnit({
      id: unit._id,
    })
    testGetStrongestNonHeroUnits({
      gameUnits: [gameUnit],
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
    const gameUnit = TestUtil.getDbGameUnit({
      id: unit._id,
    })
    testGetStrongestNonHeroUnits({
      gameUnits: [gameUnit],
      logPrefix,
      units: [unit],
      expected: [gameUnit.unit.toString()],
      traceEnabled: true,
      traceCalls: [
        [
          `${logPrefix} unit "${unit.name}" has higher strength "${unit.strength}" than previous "-1", setting highestStrength to it`,
        ],
        [`${logPrefix} unit "${unit.name}" matches highest strength of "${unit.strength}", adding to strongestUnitIds`],
        [`${logPrefix} strongestUnitIds: "${JSON.stringify([gameUnit.unit.toString()])}"`],
      ],
    })
  })
})

function testGetStrongestNonHeroUnits({
  gameUnits,
  logPrefix,
  units,
  expected,
  errorCalls = [],
  traceCalls = [],
  traceEnabled,
}: {
  gameUnits: GameUnitDbObject[]
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
        gameUnits,
        logPrefix,
        units,
      })
    ).toThrow(expected)
  } else {
    expect(
      GetStrongestNonHeroUnitIds.getStrongestNonHeroUnitIds({
        gameUnits,
        logPrefix,
        units,
      })
    ).toEqual(expected)
  }

  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
