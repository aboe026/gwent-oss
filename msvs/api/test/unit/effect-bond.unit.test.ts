import { ObjectId } from 'mongodb'

import {
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameUnitDbObject,
  GameUnitEffectDbObject,
  ImpactDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
import EffectBond from '../../src/graphql/resolvers/mutations/play-unit/effect-bond'
import { EffectReasonType } from '@gwent/graphql-schema'
import { ImpactsByUnitId } from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('effect-bond', () => {
  describe('getUnitsWithBond', () => {
    const logPrefix = 'log-prefix'
    it('returns empty array if units empty array', () => {
      testGetUnitsWithBond({
        logPrefix,
        units: [],
        unitName: 'unit-name',
        expected: [],
      })
    })
    it('returns empty array if single unit that does not have bond effect', () => {
      testGetUnitsWithBond({
        logPrefix,
        units: [TestUtil.getDbUnit({})],
        bondEffect: TestUtil.getDbEffect({
          key: EffectKey.Bond,
        }),
        unitName: 'unit-name',
        expected: [],
      })
    })
    it('returns empty array if single unit has bond effect but does not match name', () => {
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      testGetUnitsWithBond({
        logPrefix,
        units: [
          TestUtil.getDbUnit({
            effects: [bondEffect._id],
          }),
        ],
        bondEffect,
        unitName: 'wrong-name',
        expected: [],
      })
    })
    it('returns empty array if multiple units do not have bond effect', () => {
      testGetUnitsWithBond({
        logPrefix,
        units: [TestUtil.getDbUnit({}), TestUtil.getDbUnit({})],
        unitName: 'unit-name',
        expected: [],
      })
    })
    it('returns unit id if single and has bond effect and matches name', () => {
      const unitName = 'unit-name'
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      const unit = TestUtil.getDbUnit({
        name: unitName,
        effects: [bondEffect._id],
      })
      testGetUnitsWithBond({
        logPrefix,
        units: [unit],
        bondEffect,
        unitName,
        expected: [unit._id.toString()],
        debugCalls: [
          [`${logPrefix} unit "${unit._id}" has bond effect "${bondEffect._id}" and matches name "${unitName}"`],
        ],
      })
    })
    it('returns one unit id out of many if has bond effect and matches name', () => {
      const unitName = 'unit-name'
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      const unit = TestUtil.getDbUnit({
        name: unitName,
        effects: [bondEffect._id],
      })
      testGetUnitsWithBond({
        logPrefix,
        units: [TestUtil.getDbUnit({}), unit, TestUtil.getDbUnit({})],
        bondEffect,
        unitName,
        expected: [unit._id.toString()],
        debugCalls: [
          [`${logPrefix} unit "${unit._id}" has bond effect "${bondEffect._id}" and matches name "${unitName}"`],
        ],
      })
    })
    it('returns multiple unit ids if have bond effect and match name', () => {
      const unitName = 'unit-name'
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      const unit1 = TestUtil.getDbUnit({
        name: unitName,
        effects: [bondEffect._id],
      })
      const unit2 = TestUtil.getDbUnit({
        name: unitName,
        effects: [bondEffect._id],
      })
      testGetUnitsWithBond({
        logPrefix,
        units: [unit1, unit2],
        bondEffect,
        unitName,
        expected: [unit1._id.toString(), unit2._id.toString()],
        debugCalls: [
          [`${logPrefix} unit "${unit1._id}" has bond effect "${bondEffect._id}" and matches name "${unitName}"`],
          [`${logPrefix} unit "${unit2._id}" has bond effect "${bondEffect._id}" and matches name "${unitName}"`],
        ],
      })
    })
    it('returns unit id if single and has bond effect and matches name', () => {
      const unitName = 'unit-name'
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      const unit = TestUtil.getDbUnit({
        name: unitName,
        effects: [bondEffect._id],
      })
      testGetUnitsWithBond({
        logPrefix,
        units: [unit],
        bondEffect,
        unitName,
        expected: [unit._id.toString()],
        debugCalls: [
          [`${logPrefix} unit "${unit._id}" has bond effect "${bondEffect._id}" and matches name "${unitName}"`],
        ],
        traceCalls: [
          [`${logPrefix} bondEffect: "${JSON.stringify(bondEffect)}"`],
          [`${logPrefix} units: "${JSON.stringify([unit])}"`],
          [`${logPrefix} unitIdsWithBond: "${JSON.stringify([unit._id.toString()])}"`],
        ],
        traceEnabled: true,
      })
    })
  })
  describe('applyBonds', () => {
    const logPrefix = 'log-prefix'
    it('returns empty object if no bonds to apply', () => {
      const userId = new ObjectId()
      testApplyBonds({
        logPrefix,
        bondEffect: TestUtil.getDbEffect({
          key: EffectKey.Bond,
        }),
        currentPlayerId: userId,
        userId,
        musteredUnitIds: [],
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowGameUnit: TestUtil.getDbGameUnit({}),
        rowUnit: TestUtil.getDbUnit({}),
        unitIdsWithBondInRow: [],
        units: [],
        expected: {},
      })
    })
    it('returns empty object if only unit with bond is itself', () => {
      const userId = new ObjectId()
      const unit = TestUtil.getDbUnit({})
      testApplyBonds({
        logPrefix,
        bondEffect: TestUtil.getDbEffect({
          key: EffectKey.Bond,
        }),
        currentPlayerId: userId,
        userId,
        musteredUnitIds: [],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit._id,
        }),
        rowGameUnit: TestUtil.getDbGameUnit({
          id: unit._id,
        }),
        rowUnit: TestUtil.getDbUnit({
          id: unit._id,
        }),
        unitIdsWithBondInRow: [unit._id.toString()],
        units: [unit],
        expected: {},
      })
    })
    it('does not apply bond if bondEffect is undefined', () => {
      const userId = new ObjectId()
      const unit1 = TestUtil.getDbUnit({}) // bond giver
      const unit2 = TestUtil.getDbUnit({}) // bond receiver
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit2._id,
        effectiveStrength: 4,
      })
      testApplyBonds({
        logPrefix,
        bondEffect: undefined,
        currentPlayerId: userId,
        userId,
        musteredUnitIds: [],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit1._id,
        }),
        rowGameUnit: gameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: unit2._id,
        }),
        unitIdsWithBondInRow: [unit1._id.toString(), unit2._id.toString()],
        units: [unit1, unit2],
        expected: {},
      })
    })
    it('applies bond but does not return impact if bond from unit that is not newDeckUnit or muster', () => {
      const userId = new ObjectId()
      const unit1 = TestUtil.getDbUnit({}) // bond giver
      const unit2 = TestUtil.getDbUnit({}) // bond receiver
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit2._id,
        effectiveStrength: 4,
      })
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      testApplyBonds({
        logPrefix,
        bondEffect,
        currentPlayerId: userId,
        userId,
        musteredUnitIds: [],
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowGameUnit: gameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: unit2._id,
        }),
        unitIdsWithBondInRow: [unit1._id.toString(), unit2._id.toString()],
        units: [unit1, unit2],
        expected: {},
        updatedRowGameUnit: {
          ...deepClone(gameUnit),
          effectiveStrength: 8,
          effects: [
            {
              operator: 'x2',
              reason: {
                effect: bondEffect._id,
                type: EffectReasonType.Unit,
                unit: unit1._id,
              },
              total: 8,
            },
          ],
        },
        debugCalls: [
          [`${logPrefix} adding bond boost to "${unit2._id}" from "${unit1._id}" for an effectiveStrength of "8"`],
        ],
      })
    })
    it('applies bond and returns impact if bonded by newDeckUnit with effectiveStrength', () => {
      const userId = new ObjectId()
      const unit1 = TestUtil.getDbUnit({}) // bond giver
      const unit2 = TestUtil.getDbUnit({}) // bond receiver
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit2._id,
        effectiveStrength: 4,
      })
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      testApplyBonds({
        logPrefix,
        bondEffect,
        currentPlayerId: userId,
        userId,
        musteredUnitIds: [],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit1._id,
        }),
        rowGameUnit: gameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: unit2._id,
        }),
        unitIdsWithBondInRow: [unit1._id.toString(), unit2._id.toString()],
        units: [unit1, unit2],
        expected: {
          [unit1._id.toString()]: [
            {
              unit: gameUnit,
              user: userId,
            },
          ],
        },
        updatedRowGameUnit: {
          ...deepClone(gameUnit),
          effectiveStrength: 8,
          effects: [
            {
              operator: 'x2',
              reason: {
                effect: bondEffect._id,
                type: EffectReasonType.Unit,
                unit: unit1._id,
              },
              total: 8,
            },
          ],
        },
        debugCalls: [
          [`${logPrefix} adding bond boost to "${unit2._id}" from "${unit1._id}" for an effectiveStrength of "8"`],
        ],
      })
    })
    it('applies bond and returns impact if bonded by newDeckUnit without effectiveStrength', () => {
      const userId = new ObjectId()
      const unit1 = TestUtil.getDbUnit({}) // bond giver
      const unit2 = TestUtil.getDbUnit({}) // bond receiver
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit2._id,
      })
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      testApplyBonds({
        logPrefix,
        bondEffect,
        currentPlayerId: userId,
        userId,
        musteredUnitIds: [],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit1._id,
        }),
        rowGameUnit: gameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: unit2._id,
        }),
        unitIdsWithBondInRow: [unit1._id.toString(), unit2._id.toString()],
        units: [unit1, unit2],
        expected: {
          [unit1._id.toString()]: [
            {
              unit: gameUnit,
              user: userId,
            },
          ],
        },
        updatedRowGameUnit: {
          ...deepClone(gameUnit),
          effectiveStrength: 0,
          effects: [
            {
              operator: 'x2',
              reason: {
                effect: bondEffect._id,
                type: EffectReasonType.Unit,
                unit: unit1._id,
              },
              total: 0,
            },
          ],
        },
        debugCalls: [
          [`${logPrefix} adding bond boost to "${unit2._id}" from "${unit1._id}" for an effectiveStrength of "0"`],
        ],
      })
    })
    it('applies bond and returns impact if bonded by muster', () => {
      const userId = new ObjectId()
      const unit1 = TestUtil.getDbUnit({}) // bond giver
      const unit2 = TestUtil.getDbUnit({}) // bond receiver
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit2._id,
        effectiveStrength: 4,
      })
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      testApplyBonds({
        logPrefix,
        bondEffect,
        currentPlayerId: userId,
        userId,
        musteredUnitIds: [unit1._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowGameUnit: gameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: unit2._id,
        }),
        unitIdsWithBondInRow: [unit1._id.toString(), unit2._id.toString()],
        units: [unit1, unit2],
        expected: {
          [unit1._id.toString()]: [
            {
              unit: gameUnit,
              user: userId,
            },
          ],
        },
        updatedRowGameUnit: {
          ...deepClone(gameUnit),
          effectiveStrength: 8,
          effects: [
            {
              operator: 'x2',
              reason: {
                effect: bondEffect._id,
                type: EffectReasonType.Unit,
                unit: unit1._id,
              },
              total: 8,
            },
          ],
        },
        debugCalls: [
          [`${logPrefix} adding bond boost to "${unit2._id}" from "${unit1._id}" for an effectiveStrength of "8"`],
        ],
      })
    })
    it('applies bond and returns impact if multiple bonded', () => {
      const userId = new ObjectId()
      const unit1 = TestUtil.getDbUnit({}) // bond giver
      const unit2 = TestUtil.getDbUnit({}) // bond receiver
      const unit3 = TestUtil.getDbUnit({}) // bond receiver
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit2._id,
        effectiveStrength: 4,
      })
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      testApplyBonds({
        logPrefix,
        bondEffect,
        currentPlayerId: userId,
        userId,
        musteredUnitIds: [],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit1._id,
        }),
        rowGameUnit: gameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: unit2._id,
        }),
        unitIdsWithBondInRow: [unit1._id.toString(), unit2._id.toString(), unit3._id.toString()],
        units: [unit1, unit2, unit3],
        expected: {
          [unit1._id.toString()]: [
            {
              unit: gameUnit,
              user: userId,
            },
          ],
        },
        updatedRowGameUnit: {
          ...deepClone(gameUnit),
          effectiveStrength: 16,
          effects: [
            {
              operator: 'x2',
              reason: {
                effect: bondEffect._id,
                type: EffectReasonType.Unit,
                unit: unit1._id,
              },
              total: 8,
            },
            {
              operator: 'x2',
              reason: {
                effect: bondEffect._id,
                type: EffectReasonType.Unit,
                unit: unit3._id,
              },
              total: 16,
            },
          ],
        },
        debugCalls: [
          [`${logPrefix} adding bond boost to "${unit2._id}" from "${unit1._id}" for an effectiveStrength of "8"`],
          [`${logPrefix} adding bond boost to "${unit2._id}" from "${unit3._id}" for an effectiveStrength of "16"`],
        ],
      })
    })
    it('logs to trace if enabled', () => {
      const userId = new ObjectId()
      const unit1 = TestUtil.getDbUnit({}) // bond giver
      const unit2 = TestUtil.getDbUnit({}) // bond receiver
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit2._id,
        effectiveStrength: 4,
      })
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      const rowUnit = TestUtil.getDbUnit({
        id: unit2._id,
      })
      const gameUnitEffect: GameUnitEffectDbObject = {
        operator: 'x2',
        reason: {
          effect: bondEffect._id,
          type: EffectReasonType.Unit,
          unit: unit1._id,
        },
        total: 8,
      }
      const impact: ImpactDbObject = {
        unit: {
          ...gameUnit,
          effectiveStrength: 8,
          effects: [gameUnitEffect],
        },
        user: userId,
      }
      testApplyBonds({
        logPrefix,
        bondEffect,
        currentPlayerId: userId,
        userId,
        musteredUnitIds: [],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit1._id,
        }),
        rowGameUnit: gameUnit,
        rowUnit,
        unitIdsWithBondInRow: [unit1._id.toString(), unit2._id.toString()],
        units: [unit1, unit2],
        expected: {
          [unit1._id.toString()]: [impact],
        },
        updatedRowGameUnit: {
          ...deepClone(gameUnit),
          effectiveStrength: 8,
          effects: [gameUnitEffect],
        },
        debugCalls: [
          [`${logPrefix} adding bond boost to "${unit2._id}" from "${unit1._id}" for an effectiveStrength of "8"`],
        ],
        traceCalls: [
          [`${logPrefix} rowUnit: "${JSON.stringify(rowUnit)}"`],
          [`${logPrefix} bondsToApply: "${JSON.stringify([unit1._id])}"`],
          [`${logPrefix} gameUnitEffect: "${JSON.stringify(gameUnitEffect)}"`],
          [`${logPrefix} impact: "${JSON.stringify(impact)}"`],
        ],
        traceEnabled: true,
      })
    })
  })
})

function testGetUnitsWithBond({
  logPrefix,
  bondEffect,
  units,
  unitName,
  expected,
  debugCalls = [],
  traceCalls = [],
  traceEnabled,
}: {
  logPrefix: string
  bondEffect?: EffectDbObject | undefined
  units: UnitDbObject[]
  unitName: string
  expected: string[]
  debugCalls?: any[][]
  traceCalls?: any[][]
  traceEnabled?: boolean
}) {
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  EffectBond['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  expect(
    EffectBond.getUnitsWithBond({
      bondEffect,
      logPrefix,
      unitName,
      units,
    })
  ).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}

function testApplyBonds({
  logPrefix,
  unitIdsWithBondInRow,
  bondEffect,
  newDeckUnit,
  musteredUnitIds,
  rowGameUnit,
  rowUnit,
  units,
  userId,
  currentPlayerId,
  expected,
  updatedRowGameUnit,
  debugCalls = [],
  traceCalls = [],
  traceEnabled,
}: {
  logPrefix: string
  unitIdsWithBondInRow: string[]
  bondEffect?: EffectDbObject | undefined
  newDeckUnit: DeckUnitDbObject
  musteredUnitIds: string[]
  rowGameUnit: GameUnitDbObject
  rowUnit: UnitDbObject
  units: UnitDbObject[]
  userId: ObjectId
  currentPlayerId: ObjectId | undefined
  expected: ImpactsByUnitId
  updatedRowGameUnit?: GameUnitDbObject
  debugCalls?: any[][]
  traceCalls?: any[][]
  traceEnabled?: boolean
}) {
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  EffectBond['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any
  const ogRowGameUnit = deepClone(rowGameUnit)

  expect(
    EffectBond.applyBonds({
      bondEffect,
      currentPlayerId,
      logPrefix,
      musteredUnitIds,
      newDeckUnit,
      rowGameUnit,
      rowUnit,
      unitIdsWithBondInRow,
      units,
      userId,
    })
  ).toEqual(expected)
  expect(rowGameUnit).toEqual(updatedRowGameUnit || ogRowGameUnit)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
