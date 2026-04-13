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
import EffectHorn from '../../src/graphql/resolvers/mutations/play-unit/effect-horn'
import { EFFECT_OPERATOR } from '@gwent/constants'
import { EffectReasonType } from '@gwent/graphql-schema'
import { ImpactsByUnitId } from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('effect-horn', () => {
  describe('applyHorn', () => {
    const logPrefix = 'log-prefix'
    it('does not effect hero', () => {
      const rowUnit = TestUtil.getDbUnit({
        hero: true,
      })
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        id: rowUnit._id,
      })
      const horningUnit = TestUtil.getDbUnit({})
      const hornEffect = TestUtil.getDbEffect({
        key: EffectKey.Horn,
      })
      testApplyHorn({
        hornEffect,
        logPrefix,
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit,
        rowUnit,
        unitIdsWithHornInRow: [horningUnit._id.toString()],
        units: [horningUnit],
        expected: {},
        updatedRowFieldUnit: deepClone(rowFieldUnit),
        debugCalls: [[`${logPrefix} rowUnit "${rowUnit._id}" is hero so not susceptible to horn effect.`]],
      })
    })
    it('does not effect if no unitIdsWithHornInRow', () => {
      const rowUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        id: rowUnit._id,
      })
      const horningUnit = TestUtil.getDbUnit({})
      const hornEffect = TestUtil.getDbEffect({
        key: EffectKey.Horn,
      })
      testApplyHorn({
        hornEffect,
        logPrefix,
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit,
        rowUnit,
        unitIdsWithHornInRow: [],
        units: [horningUnit],
        expected: {},
        updatedRowFieldUnit: deepClone(rowFieldUnit),
      })
    })
    it('does not effect itself', () => {
      const rowUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        id: rowUnit._id,
      })
      const hornEffect = TestUtil.getDbEffect({
        key: EffectKey.Horn,
      })
      testApplyHorn({
        hornEffect,
        logPrefix,
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit,
        rowUnit,
        unitIdsWithHornInRow: [rowUnit._id.toString()],
        units: [rowUnit],
        expected: {},
        updatedRowFieldUnit: deepClone(rowFieldUnit),
      })
    })
    it('maintains zero effectiveStrength if not already set', () => {
      const rowUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        id: rowUnit._id,
      })
      const horningUnit = TestUtil.getDbUnit({})
      const hornEffect = TestUtil.getDbEffect({
        key: EffectKey.Horn,
      })
      testApplyHorn({
        hornEffect,
        logPrefix,
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit,
        rowUnit,
        unitIdsWithHornInRow: [horningUnit._id.toString()],
        units: [horningUnit],
        expected: {},
        updatedRowFieldUnit: {
          ...deepClone(rowFieldUnit),
          effectiveStrength: 0,
          effects: [
            {
              operator: EFFECT_OPERATOR.Double,
              total: 0,
              reason: {
                effect: hornEffect._id,
                type: EffectReasonType.Unit,
                unit: horningUnit._id,
              },
            },
          ],
        },
        debugCalls: [
          [
            `${logPrefix} adding horn boost to "${rowUnit._id}" from "${horningUnit._id}" for an effectiveStrength of "0"`,
          ],
        ],
      })
    })
    it('doubles effectiveStrength without impact if horningUnit is not newDeckUnit', () => {
      const rowUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        id: rowUnit._id,
        effectiveStrength: 3,
      })
      const horningUnit = TestUtil.getDbUnit({})
      const hornEffect = TestUtil.getDbEffect({
        key: EffectKey.Horn,
      })
      testApplyHorn({
        hornEffect,
        logPrefix,
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit,
        rowUnit,
        unitIdsWithHornInRow: [horningUnit._id.toString()],
        units: [horningUnit],
        expected: {},
        updatedRowFieldUnit: {
          ...deepClone(rowFieldUnit),
          effectiveStrength: 6,
          effects: [
            {
              operator: EFFECT_OPERATOR.Double,
              total: 6,
              reason: {
                effect: hornEffect._id,
                type: EffectReasonType.Unit,
                unit: horningUnit._id,
              },
            },
          ],
        },
        debugCalls: [
          [
            `${logPrefix} adding horn boost to "${rowUnit._id}" from "${horningUnit._id}" for an effectiveStrength of "6"`,
          ],
        ],
      })
    })
    it('doubles effectiveStrength without impact if currentPlayerId is not userId', () => {
      const rowUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        id: rowUnit._id,
        effectiveStrength: 3,
      })
      const horningUnit = TestUtil.getDbUnit({})
      const hornEffect = TestUtil.getDbEffect({
        key: EffectKey.Horn,
      })
      testApplyHorn({
        hornEffect,
        logPrefix,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: horningUnit._id,
        }),
        rowFieldUnit,
        rowUnit,
        unitIdsWithHornInRow: [horningUnit._id.toString()],
        units: [horningUnit],
        currentPlayerId: new ObjectId(),
        userId: new ObjectId(),
        expected: {},
        updatedRowFieldUnit: {
          ...deepClone(rowFieldUnit),
          effectiveStrength: 6,
          effects: [
            {
              operator: EFFECT_OPERATOR.Double,
              total: 6,
              reason: {
                effect: hornEffect._id,
                type: EffectReasonType.Unit,
                unit: horningUnit._id,
              },
            },
          ],
        },
        debugCalls: [
          [
            `${logPrefix} adding horn boost to "${rowUnit._id}" from "${horningUnit._id}" for an effectiveStrength of "6"`,
          ],
        ],
      })
    })
    it('doubles effectiveStrength with impact if horningUnit is newDeckUnit and currentPlayerId is userId', () => {
      const rowUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        id: rowUnit._id,
        effectiveStrength: 3,
      })
      const horningUnit = TestUtil.getDbUnit({})
      const hornEffect = TestUtil.getDbEffect({
        key: EffectKey.Horn,
      })
      const userId = new ObjectId()
      const effects: FieldUnitEffectDbObject[] = [
        {
          operator: EFFECT_OPERATOR.Double,
          total: 6,
          reason: {
            effect: hornEffect._id,
            type: EffectReasonType.Unit,
            unit: horningUnit._id,
          },
        },
      ]
      const tacoUnit = TestUtil.getDbTacoUnit({
        id: rowFieldUnit.unit,
        effectiveStrength: 6,
        effects,
        artStyle: rowFieldUnit.artStyle,
        row: rowFieldUnit.row as Combat,
      })
      testApplyHorn({
        hornEffect,
        logPrefix,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: horningUnit._id,
        }),
        rowFieldUnit,
        rowUnit,
        unitIdsWithHornInRow: [horningUnit._id.toString()],
        units: [horningUnit],
        currentPlayerId: userId,
        userId: userId,
        expected: {
          [horningUnit._id.toString()]: [
            {
              unit: tacoUnit,
              user: userId,
            },
          ],
        },
        updatedRowFieldUnit: {
          ...deepClone(rowFieldUnit),
          effectiveStrength: 6,
          effects,
        },
        debugCalls: [
          [
            `${logPrefix} adding horn boost to "${rowUnit._id}" from "${horningUnit._id}" for an effectiveStrength of "6"`,
          ],
        ],
      })
    })
    it('logs to trace if enabled', () => {
      const rowUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        id: rowUnit._id,
        effectiveStrength: 3,
      })
      const horningUnit = TestUtil.getDbUnit({})
      const hornEffect = TestUtil.getDbEffect({
        key: EffectKey.Horn,
      })
      const userId = new ObjectId()
      const fieldUnitEffect: FieldUnitEffectDbObject = {
        operator: EFFECT_OPERATOR.Double,
        reason: {
          effect: hornEffect._id,
          type: EffectReasonType.Unit,
          unit: horningUnit._id,
        },
        total: 6,
      }
      const updatedRowFieldUnit = {
        ...deepClone(rowFieldUnit),
        effectiveStrength: 6,
        effects: [fieldUnitEffect],
      }
      const tacoUnit = TestUtil.getDbTacoUnit({
        id: updatedRowFieldUnit.unit,
        effectiveStrength: 6,
        effects: [fieldUnitEffect],
        artStyle: updatedRowFieldUnit.artStyle,
        row: updatedRowFieldUnit.row as Combat,
      })
      const impact: ImpactDbObject = {
        unit: tacoUnit,
        user: userId,
      }
      testApplyHorn({
        hornEffect,
        logPrefix,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: horningUnit._id,
        }),
        rowFieldUnit,
        rowUnit,
        unitIdsWithHornInRow: [horningUnit._id.toString()],
        units: [horningUnit],
        currentPlayerId: userId,
        userId: userId,
        expected: {
          [horningUnit._id.toString()]: [impact],
        },
        updatedRowFieldUnit,
        debugCalls: [
          [
            `${logPrefix} adding horn boost to "${rowUnit._id}" from "${horningUnit._id}" for an effectiveStrength of "6"`,
          ],
        ],
        traceEnabled: true,
        traceCalls: [
          [`${logPrefix} rowUnit: "${JSON.stringify(rowUnit)}"`],
          [`${logPrefix} hornsToApply: "${JSON.stringify([horningUnit._id.toString()])}"`],
          [`${logPrefix} fieldUnitEffect: "${JSON.stringify(fieldUnitEffect)}"`],
          [`${logPrefix} impact: "${JSON.stringify(impact)}"`],
        ],
      })
    })
  })
})

function testApplyHorn({
  logPrefix,
  unitIdsWithHornInRow,
  hornEffect,
  newDeckUnit,
  rowFieldUnit,
  rowUnit,
  units,
  userId = new ObjectId(),
  currentPlayerId,
  expected,
  updatedRowFieldUnit,
  debugCalls = [],
  traceCalls = [],
  traceEnabled,
}: {
  logPrefix: string
  unitIdsWithHornInRow: string[]
  hornEffect: EffectDbObject | undefined
  newDeckUnit: DeckUnitDbObject
  rowFieldUnit: FieldUnitDbObject
  rowUnit: UnitDbObject
  units: UnitDbObject[]
  userId?: ObjectId
  currentPlayerId?: ObjectId | undefined
  expected: ImpactsByUnitId
  updatedRowFieldUnit: FieldUnitDbObject
  debugCalls?: string[][]
  traceCalls?: string[][]
  traceEnabled?: boolean
}) {
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  EffectHorn['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  expect(
    EffectHorn.applyHorn({
      currentPlayerId,
      hornEffect,
      logPrefix,
      newDeckUnit,
      rowFieldUnit,
      rowUnit,
      unitIdsWithHornInRow,
      units,
      userId,
    })
  ).toEqual(expected)
  expect(rowFieldUnit).toEqual(updatedRowFieldUnit)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
