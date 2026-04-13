import { ObjectId } from 'mongodb'

import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  FieldUnitDbObject,
  FieldUnitEffectDbObject,
  ImpactDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
import EffectBond from '../../src/graphql/resolvers/mutations/play-unit/effect-bond'
import { EFFECT_OPERATOR } from '@gwent/constants'
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
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit: TestUtil.getDbFieldUnit({}),
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
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit._id,
        }),
        rowFieldUnit: TestUtil.getDbFieldUnit({
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
      const fieldUnit = TestUtil.getDbFieldUnit({
        id: unit2._id,
        effectiveStrength: 4,
      })
      testApplyBonds({
        logPrefix,
        bondEffect: undefined,
        currentPlayerId: userId,
        userId,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit1._id,
        }),
        rowFieldUnit: fieldUnit,
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
      const fieldUnit = TestUtil.getDbFieldUnit({
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
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit: fieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: unit2._id,
        }),
        unitIdsWithBondInRow: [unit1._id.toString(), unit2._id.toString()],
        units: [unit1, unit2],
        expected: {},
        updatedRowFieldUnit: {
          ...deepClone(fieldUnit),
          effectiveStrength: 8,
          effects: [
            {
              operator: EFFECT_OPERATOR.Double,
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
      const fieldUnit = TestUtil.getDbFieldUnit({
        id: unit2._id,
        effectiveStrength: 4,
      })
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      const effects: FieldUnitEffectDbObject[] = [
        {
          operator: EFFECT_OPERATOR.Double,
          reason: {
            effect: bondEffect._id,
            type: EffectReasonType.Unit,
            unit: unit1._id,
          },
          total: 8,
        },
      ]
      const tacoUnit = TestUtil.getDbTacoUnit({
        id: fieldUnit.unit,
        effectiveStrength: 8,
        effects,
        artStyle: fieldUnit.artStyle,
        row: fieldUnit.row as Combat,
      })
      testApplyBonds({
        logPrefix,
        bondEffect,
        currentPlayerId: userId,
        userId,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit1._id,
        }),
        rowFieldUnit: fieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: unit2._id,
        }),
        unitIdsWithBondInRow: [unit1._id.toString(), unit2._id.toString()],
        units: [unit1, unit2],
        expected: {
          [unit1._id.toString()]: [
            {
              unit: tacoUnit,
              user: userId,
            },
          ],
        },
        updatedRowFieldUnit: {
          ...deepClone(fieldUnit),
          effectiveStrength: 8,
          effects,
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
      const fieldUnit = TestUtil.getDbFieldUnit({
        id: unit2._id,
      })
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      const effects: FieldUnitEffectDbObject[] = [
        {
          operator: EFFECT_OPERATOR.Double,
          reason: {
            effect: bondEffect._id,
            type: EffectReasonType.Unit,
            unit: unit1._id,
          },
          total: 0,
        },
      ]
      const tacoUnit = TestUtil.getDbTacoUnit({
        id: fieldUnit.unit,
        effectiveStrength: 0,
        effects,
        artStyle: fieldUnit.artStyle,
        row: fieldUnit.row as Combat,
      })
      testApplyBonds({
        logPrefix,
        bondEffect,
        currentPlayerId: userId,
        userId,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit1._id,
        }),
        rowFieldUnit: fieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: unit2._id,
        }),
        unitIdsWithBondInRow: [unit1._id.toString(), unit2._id.toString()],
        units: [unit1, unit2],
        expected: {
          [unit1._id.toString()]: [
            {
              unit: tacoUnit,
              user: userId,
            },
          ],
        },
        updatedRowFieldUnit: {
          ...deepClone(fieldUnit),
          effectiveStrength: 0,
          effects,
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
      const fieldUnit = TestUtil.getDbFieldUnit({
        id: unit2._id,
        effectiveStrength: 4,
      })
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      const effects: FieldUnitEffectDbObject[] = [
        {
          operator: EFFECT_OPERATOR.Double,
          reason: {
            effect: bondEffect._id,
            type: EffectReasonType.Unit,
            unit: unit1._id,
          },
          total: 8,
        },
      ]
      const tacoUnit = TestUtil.getDbTacoUnit({
        id: fieldUnit.unit,
        effectiveStrength: 8,
        effects,
        artStyle: fieldUnit.artStyle,
        row: fieldUnit.row as Combat,
      })
      testApplyBonds({
        logPrefix,
        bondEffect,
        currentPlayerId: userId,
        userId,
        musteredUnitIds: [unit1._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit: fieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: unit2._id,
        }),
        unitIdsWithBondInRow: [unit1._id.toString(), unit2._id.toString()],
        units: [unit1, unit2],
        expected: {
          [unit1._id.toString()]: [
            {
              unit: tacoUnit,
              user: userId,
            },
          ],
        },
        updatedRowFieldUnit: {
          ...deepClone(fieldUnit),
          effectiveStrength: 8,
          effects,
        },
        debugCalls: [
          [`${logPrefix} adding bond boost to "${unit2._id}" from "${unit1._id}" for an effectiveStrength of "8"`],
        ],
      })
    })
    it('applies bond and returns impact if bonded by mardroeme', () => {
      const userId = new ObjectId()
      const unit1 = TestUtil.getDbUnit({}) // bond giver
      const unit2 = TestUtil.getDbUnit({}) // bond receiver
      const fieldUnit = TestUtil.getDbFieldUnit({
        id: unit2._id,
        effectiveStrength: 4,
      })
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      const effects: FieldUnitEffectDbObject[] = [
        {
          operator: EFFECT_OPERATOR.Double,
          reason: {
            effect: bondEffect._id,
            type: EffectReasonType.Unit,
            unit: unit1._id,
          },
          total: 8,
        },
      ]
      const tacoUnit = TestUtil.getDbTacoUnit({
        id: fieldUnit.unit,
        effectiveStrength: 8,
        effects,
        artStyle: fieldUnit.artStyle,
        row: fieldUnit.row as Combat,
      })
      testApplyBonds({
        logPrefix,
        bondEffect,
        currentPlayerId: userId,
        userId,
        transformedUnitIds: [unit1._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit: fieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: unit2._id,
        }),
        unitIdsWithBondInRow: [unit1._id.toString(), unit2._id.toString()],
        units: [unit1, unit2],
        expected: {
          [unit1._id.toString()]: [
            {
              unit: tacoUnit,
              user: userId,
            },
          ],
        },
        updatedRowFieldUnit: {
          ...deepClone(fieldUnit),
          effectiveStrength: 8,
          effects,
        },
        debugCalls: [
          [`${logPrefix} adding bond boost to "${unit2._id}" from "${unit1._id}" for an effectiveStrength of "8"`],
        ],
      })
    })
    it('applies bond and returns impact if multiple bonded by newDeckUnit', () => {
      const userId = new ObjectId()
      const unit1 = TestUtil.getDbUnit({}) // bond giver
      const unit2 = TestUtil.getDbUnit({}) // bond receiver
      const unit3 = TestUtil.getDbUnit({}) // bond receiver
      const fieldUnit = TestUtil.getDbFieldUnit({
        id: unit2._id,
        effectiveStrength: 4,
      })
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      const effects: FieldUnitEffectDbObject[] = [
        {
          operator: EFFECT_OPERATOR.Double,
          reason: {
            effect: bondEffect._id,
            type: EffectReasonType.Unit,
            unit: unit1._id,
          },
          total: 8,
        },
        {
          operator: EFFECT_OPERATOR.Double,
          reason: {
            effect: bondEffect._id,
            type: EffectReasonType.Unit,
            unit: unit3._id,
          },
          total: 16,
        },
      ]
      const tacoUnit = TestUtil.getDbTacoUnit({
        id: fieldUnit.unit,
        effectiveStrength: 16,
        effects,
        artStyle: fieldUnit.artStyle,
        row: fieldUnit.row as Combat,
      })
      testApplyBonds({
        logPrefix,
        bondEffect,
        currentPlayerId: userId,
        userId,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit1._id,
        }),
        rowFieldUnit: fieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: unit2._id,
        }),
        unitIdsWithBondInRow: [unit1._id.toString(), unit2._id.toString(), unit3._id.toString()],
        units: [unit1, unit2, unit3],
        expected: {
          [unit1._id.toString()]: [
            {
              unit: tacoUnit,
              user: userId,
            },
          ],
        },
        updatedRowFieldUnit: {
          ...deepClone(fieldUnit),
          effectiveStrength: 16,
          effects,
        },
        debugCalls: [
          [`${logPrefix} adding bond boost to "${unit2._id}" from "${unit1._id}" for an effectiveStrength of "8"`],
          [`${logPrefix} adding bond boost to "${unit2._id}" from "${unit3._id}" for an effectiveStrength of "16"`],
        ],
      })
    })
    it('applies bond and returns impact if multiple bonded by muster and mardroeme', () => {
      const userId = new ObjectId()
      const unit1 = TestUtil.getDbUnit({}) // bond giver
      const unit2 = TestUtil.getDbUnit({}) // bond receiver
      const unit3 = TestUtil.getDbUnit({}) // bond receiver
      const fieldUnit = TestUtil.getDbFieldUnit({
        id: unit2._id,
        effectiveStrength: 4,
      })
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      const effects: FieldUnitEffectDbObject[] = [
        {
          operator: EFFECT_OPERATOR.Double,
          reason: {
            effect: bondEffect._id,
            type: EffectReasonType.Unit,
            unit: unit1._id,
          },
          total: 8,
        },
        {
          operator: EFFECT_OPERATOR.Double,
          reason: {
            effect: bondEffect._id,
            type: EffectReasonType.Unit,
            unit: unit3._id,
          },
          total: 16,
        },
      ]
      const tacoUnit = TestUtil.getDbTacoUnit({
        id: fieldUnit.unit,
        effectiveStrength: 16,
        effects,
        artStyle: fieldUnit.artStyle,
        row: fieldUnit.row as Combat,
      })
      testApplyBonds({
        logPrefix,
        bondEffect,
        currentPlayerId: userId,
        userId,
        musteredUnitIds: [unit1._id.toString()],
        transformedUnitIds: [unit3._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit: fieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: unit2._id,
        }),
        unitIdsWithBondInRow: [unit1._id.toString(), unit2._id.toString(), unit3._id.toString()],
        units: [unit1, unit2, unit3],
        expected: {
          [unit1._id.toString()]: [
            {
              unit: tacoUnit,
              user: userId,
            },
          ],
          [unit3._id.toString()]: [
            {
              unit: tacoUnit,
              user: userId,
            },
          ],
        },
        updatedRowFieldUnit: {
          ...deepClone(fieldUnit),
          effectiveStrength: 16,
          effects,
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
      const fieldUnit = TestUtil.getDbFieldUnit({
        id: unit2._id,
        effectiveStrength: 4,
      })
      const bondEffect = TestUtil.getDbEffect({
        key: EffectKey.Bond,
      })
      const rowUnit = TestUtil.getDbUnit({
        id: unit2._id,
      })
      const fieldUnitEffect: FieldUnitEffectDbObject = {
        operator: EFFECT_OPERATOR.Double,
        reason: {
          effect: bondEffect._id,
          type: EffectReasonType.Unit,
          unit: unit1._id,
        },
        total: 8,
      }
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbTacoUnit({
          id: fieldUnit.unit,
          effectiveStrength: 8,
          effects: [fieldUnitEffect],
          artStyle: fieldUnit.artStyle,
        }),
        user: userId,
      }
      testApplyBonds({
        logPrefix,
        bondEffect,
        currentPlayerId: userId,
        userId,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit1._id,
        }),
        rowFieldUnit: fieldUnit,
        rowUnit,
        unitIdsWithBondInRow: [unit1._id.toString(), unit2._id.toString()],
        units: [unit1, unit2],
        expected: {
          [unit1._id.toString()]: [impact],
        },
        updatedRowFieldUnit: {
          ...deepClone(fieldUnit),
          effectiveStrength: 8,
          effects: [fieldUnitEffect],
        },
        debugCalls: [
          [`${logPrefix} adding bond boost to "${unit2._id}" from "${unit1._id}" for an effectiveStrength of "8"`],
        ],
        traceCalls: [
          [`${logPrefix} rowUnit: "${JSON.stringify(rowUnit)}"`],
          [`${logPrefix} bondsToApply: "${JSON.stringify([unit1._id])}"`],
          [`${logPrefix} fieldUnitEffect: "${JSON.stringify(fieldUnitEffect)}"`],
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
  musteredUnitIds = [],
  transformedUnitIds = [],
  rowFieldUnit,
  rowUnit,
  units,
  userId,
  currentPlayerId,
  expected,
  updatedRowFieldUnit,
  debugCalls = [],
  traceCalls = [],
  traceEnabled,
}: {
  logPrefix: string
  unitIdsWithBondInRow: string[]
  bondEffect?: EffectDbObject | undefined
  newDeckUnit: DeckUnitDbObject
  musteredUnitIds?: string[]
  transformedUnitIds?: string[]
  rowFieldUnit: FieldUnitDbObject
  rowUnit: UnitDbObject
  units: UnitDbObject[]
  userId: ObjectId
  currentPlayerId: ObjectId | undefined
  expected: ImpactsByUnitId
  updatedRowFieldUnit?: FieldUnitDbObject
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
  const ogRowFieldUnit = deepClone(rowFieldUnit)

  expect(
    EffectBond.applyBonds({
      bondEffect,
      currentPlayerId,
      logPrefix,
      musteredUnitIds,
      transformedUnitIds,
      newDeckUnit,
      rowFieldUnit,
      rowUnit,
      unitIdsWithBondInRow,
      units,
      userId,
    })
  ).toEqual(expected)
  expect(rowFieldUnit).toEqual(updatedRowFieldUnit || ogRowFieldUnit)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
