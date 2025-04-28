import { GameUnitDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import GetStrongestNonHeroUnits from '../../src/graphql/resolvers/mutations/play-unit/get-strongest-non-hero-units'
import TestUtil from '../util/test-util'

describe('get-strongest-non-hero-units', () => {
  const logPrefix = 'log-prefix'
  it('returns empty array if gameUnits empty array', () => {
    testGetStrongestNonHeroUnits({
      gameUnits: [],
      logPrefix,
      units: [],
      expected: [],
      traceCalls: [[`${logPrefix} minimumStrength: "undefined"`]],
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
      traceCalls: [[`${logPrefix} minimumStrength: "undefined"`]],
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
      traceCalls: [
        [`${logPrefix} minimumStrength: "undefined"`],
        [`${logPrefix} unit "${unit.name}" does not have strength, not considering for highestStrength`],
      ],
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
      expected: [gameUnit],
      traceCalls: [
        [`${logPrefix} minimumStrength: "undefined"`],
        [
          `${logPrefix} unit "${unit.name}" has higher strength "${unit.strength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit.name}" matches highest strength of "${unit.strength}", adding to strongestGameUnits`,
        ],
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
      expected: [gameUnit],
      traceCalls: [
        [`${logPrefix} minimumStrength: "undefined"`],
        [
          `${logPrefix} unit "${unit.name}" has higher strength "${gameUnit.effectiveStrength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit.name}" matches highest strength of "${gameUnit.effectiveStrength}", adding to strongestGameUnits`,
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
      expected: [gameUnit1],
      traceCalls: [
        [`${logPrefix} minimumStrength: "undefined"`],
        [
          `${logPrefix} unit "${unit1.name}" has higher strength "${gameUnit1.effectiveStrength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit2.name}" strength "${unit2.strength}" is not greater than highestStrength of "${gameUnit1.effectiveStrength}"`,
        ],
        [
          `${logPrefix} unit "${unit1.name}" matches highest strength of "${gameUnit1.effectiveStrength}", adding to strongestGameUnits`,
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
      expected: [gameUnit1],
      traceCalls: [
        [`${logPrefix} minimumStrength: "undefined"`],
        [
          `${logPrefix} unit "${unit1.name}" has higher strength "${unit1.strength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit2.name}" strength "${unit2.strength}" is not greater than highestStrength of "${unit1.strength}"`,
        ],
        [
          `${logPrefix} unit "${unit1.name}" matches highest strength of "${unit1.strength}", adding to strongestGameUnits`,
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
      expected: [gameUnit2],
      traceCalls: [
        [`${logPrefix} minimumStrength: "undefined"`],
        [
          `${logPrefix} unit "${unit1.name}" has higher strength "${unit1.strength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit2.name}" has higher strength "${unit2.strength}" than previous "${unit1.strength}", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit2.name}" matches highest strength of "${unit2.strength}", adding to strongestGameUnits`,
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
      expected: [gameUnit1, gameUnit2],
      traceCalls: [
        [`${logPrefix} minimumStrength: "undefined"`],
        [
          `${logPrefix} unit "${unit1.name}" has higher strength "${unit1.strength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit2.name}" strength "${unit2.strength}" is not greater than highestStrength of "${unit1.strength}"`,
        ],
        [
          `${logPrefix} unit "${unit1.name}" matches highest strength of "${unit1.strength}", adding to strongestGameUnits`,
        ],
        [
          `${logPrefix} unit "${unit2.name}" matches highest strength of "${unit2.strength}", adding to strongestGameUnits`,
        ],
      ],
    })
  })
  it('ignores minimumStrength if null', () => {
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
      minimumStrength: null,
      expected: [gameUnit],
      traceCalls: [
        [`${logPrefix} minimumStrength: "null"`],
        [
          `${logPrefix} unit "${unit.name}" has higher strength "${unit.strength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit.name}" matches highest strength of "${unit.strength}", adding to strongestGameUnits`,
        ],
      ],
    })
  })
  it('ignores unit if less than minimum strength', () => {
    const minimumStrength = 2
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
      minimumStrength,
      expected: [],
      traceCalls: [
        [`${logPrefix} minimumStrength: "${minimumStrength}"`],
        [
          `${logPrefix} unit "${unit.name}" strength "${unit.strength}" is not greater than minimumStrength of "${minimumStrength}", not considering for highestStrength`,
        ],
      ],
    })
  })
  it('returns unit if strength same as minimum strength', () => {
    const minimumStrength = 2
    const unit = TestUtil.getDbUnit({
      strength: minimumStrength,
    })
    const gameUnit = TestUtil.getDbGameUnit({
      id: unit._id,
    })
    testGetStrongestNonHeroUnits({
      gameUnits: [gameUnit],
      logPrefix,
      units: [unit],
      minimumStrength,
      expected: [gameUnit],
      traceCalls: [
        [`${logPrefix} minimumStrength: "${minimumStrength}"`],
        [
          `${logPrefix} unit "${unit.name}" has higher strength "${unit.strength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit.name}" matches highest strength of "${unit.strength}", adding to strongestGameUnits`,
        ],
      ],
    })
  })
  it('returns unit if strength greater than minimum strength', () => {
    const minimumStrength = 2
    const unit = TestUtil.getDbUnit({
      strength: minimumStrength + 1,
    })
    const gameUnit = TestUtil.getDbGameUnit({
      id: unit._id,
    })
    testGetStrongestNonHeroUnits({
      gameUnits: [gameUnit],
      logPrefix,
      units: [unit],
      minimumStrength,
      expected: [gameUnit],
      traceCalls: [
        [`${logPrefix} minimumStrength: "${minimumStrength}"`],
        [
          `${logPrefix} unit "${unit.name}" has higher strength "${unit.strength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit.name}" matches highest strength of "${unit.strength}", adding to strongestGameUnits`,
        ],
      ],
    })
  })
  it('returns unit if effectiveStrength same as minimum strength', () => {
    const minimumStrength = 2
    const unit = TestUtil.getDbUnit({})
    const gameUnit = TestUtil.getDbGameUnit({
      id: unit._id,
      effectiveStrength: minimumStrength,
    })
    testGetStrongestNonHeroUnits({
      gameUnits: [gameUnit],
      logPrefix,
      units: [unit],
      minimumStrength,
      expected: [gameUnit],
      traceCalls: [
        [`${logPrefix} minimumStrength: "${minimumStrength}"`],
        [
          `${logPrefix} unit "${unit.name}" has higher strength "${gameUnit.effectiveStrength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit.name}" matches highest strength of "${gameUnit.effectiveStrength}", adding to strongestGameUnits`,
        ],
      ],
    })
  })
  it('returns unit if effectiveStrength greater than minimum strength', () => {
    const minimumStrength = 2
    const unit = TestUtil.getDbUnit({})
    const gameUnit = TestUtil.getDbGameUnit({
      id: unit._id,
      effectiveStrength: minimumStrength + 1,
    })
    testGetStrongestNonHeroUnits({
      gameUnits: [gameUnit],
      logPrefix,
      units: [unit],
      minimumStrength,
      expected: [gameUnit],
      traceCalls: [
        [`${logPrefix} minimumStrength: "${minimumStrength}"`],
        [
          `${logPrefix} unit "${unit.name}" has higher strength "${gameUnit.effectiveStrength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit.name}" matches highest strength of "${gameUnit.effectiveStrength}", adding to strongestGameUnits`,
        ],
      ],
    })
  })
  it('returns unit if strength less than but effectiveStrength same as minimum strength', () => {
    const minimumStrength = 2
    const unit = TestUtil.getDbUnit({
      strength: 1,
    })
    const gameUnit = TestUtil.getDbGameUnit({
      id: unit._id,
      effectiveStrength: minimumStrength,
    })
    testGetStrongestNonHeroUnits({
      gameUnits: [gameUnit],
      logPrefix,
      units: [unit],
      minimumStrength,
      expected: [gameUnit],
      traceCalls: [
        [`${logPrefix} minimumStrength: "${minimumStrength}"`],
        [
          `${logPrefix} unit "${unit.name}" has higher strength "${gameUnit.effectiveStrength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit.name}" matches highest strength of "${gameUnit.effectiveStrength}", adding to strongestGameUnits`,
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
      traceCalls: [
        [`${logPrefix} minimumStrength: "undefined"`],
        [`${logPrefix} unit "${unit.name}" is a hero, not considering for highestStrength`],
      ],
    })
  })
  it('logs to trace if enabled', () => {
    const minimumStrength = 2
    const unit = TestUtil.getDbUnit({})
    const gameUnit = TestUtil.getDbGameUnit({
      id: unit._id,
      effectiveStrength: minimumStrength + 1,
    })
    testGetStrongestNonHeroUnits({
      gameUnits: [gameUnit],
      logPrefix,
      units: [unit],
      minimumStrength,
      expected: [gameUnit],
      traceEnabled: true,
      traceCalls: [
        [`${logPrefix} minimumStrength: "${minimumStrength}"`],
        [
          `${logPrefix} unit "${unit.name}" has higher strength "${gameUnit.effectiveStrength}" than previous "-1", setting highestStrength to it`,
        ],
        [
          `${logPrefix} unit "${unit.name}" matches highest strength of "${gameUnit.effectiveStrength}", adding to strongestGameUnits`,
        ],
        [`${logPrefix} strongestGameUnits: "${JSON.stringify([gameUnit])}"`],
      ],
    })
  })
})

function testGetStrongestNonHeroUnits({
  gameUnits,
  logPrefix,
  minimumStrength,
  units,
  expected,
  errorCalls = [],
  traceCalls = [],
  traceEnabled,
}: {
  gameUnits: GameUnitDbObject[]
  logPrefix: string
  minimumStrength?: number | undefined | null
  units: UnitDbObject[]
  expected?: GameUnitDbObject[] | Error
  errorCalls?: string[][]
  traceCalls?: string[][]
  traceEnabled?: boolean
}) {
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GetStrongestNonHeroUnits['logger'] = {
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  if (expected instanceof Error) {
    expect(() =>
      GetStrongestNonHeroUnits.getStrongestNonHeroUnits({
        gameUnits,
        logPrefix,
        minimumStrength,
        units,
      })
    ).toThrow(expected)
  } else {
    expect(
      GetStrongestNonHeroUnits.getStrongestNonHeroUnits({
        gameUnits,
        logPrefix,
        minimumStrength,
        units,
      })
    ).toEqual(expected)
  }

  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
