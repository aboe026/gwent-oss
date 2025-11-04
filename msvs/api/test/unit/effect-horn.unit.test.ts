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
      const rowGameUnit = TestUtil.getDbGameUnit({
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
        rowGameUnit,
        rowUnit,
        unitIdsWithHornInRow: [horningUnit._id.toString()],
        units: [horningUnit],
        expected: {},
        updatedRowGameUnit: deepClone(rowGameUnit),
        debugCalls: [[`${logPrefix} rowUnit "${rowUnit._id}" is hero so not susceptible to horn effect.`]],
      })
    })
    it('does not effect if no unitIdsWithHornInRow', () => {
      const rowUnit = TestUtil.getDbUnit({})
      const rowGameUnit = TestUtil.getDbGameUnit({
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
        rowGameUnit,
        rowUnit,
        unitIdsWithHornInRow: [],
        units: [horningUnit],
        expected: {},
        updatedRowGameUnit: deepClone(rowGameUnit),
      })
    })
    it('does not effect itself', () => {
      const rowUnit = TestUtil.getDbUnit({})
      const rowGameUnit = TestUtil.getDbGameUnit({
        id: rowUnit._id,
      })
      const hornEffect = TestUtil.getDbEffect({
        key: EffectKey.Horn,
      })
      testApplyHorn({
        hornEffect,
        logPrefix,
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowGameUnit,
        rowUnit,
        unitIdsWithHornInRow: [rowUnit._id.toString()],
        units: [rowUnit],
        expected: {},
        updatedRowGameUnit: deepClone(rowGameUnit),
      })
    })
    it('maintains zero effectiveStrength if not already set', () => {
      const rowUnit = TestUtil.getDbUnit({})
      const rowGameUnit = TestUtil.getDbGameUnit({
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
        rowGameUnit,
        rowUnit,
        unitIdsWithHornInRow: [horningUnit._id.toString()],
        units: [horningUnit],
        expected: {},
        updatedRowGameUnit: {
          ...deepClone(rowGameUnit),
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
      const rowGameUnit = TestUtil.getDbGameUnit({
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
        rowGameUnit,
        rowUnit,
        unitIdsWithHornInRow: [horningUnit._id.toString()],
        units: [horningUnit],
        expected: {},
        updatedRowGameUnit: {
          ...deepClone(rowGameUnit),
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
      const rowGameUnit = TestUtil.getDbGameUnit({
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
        rowGameUnit,
        rowUnit,
        unitIdsWithHornInRow: [horningUnit._id.toString()],
        units: [horningUnit],
        currentPlayerId: new ObjectId(),
        userId: new ObjectId(),
        expected: {},
        updatedRowGameUnit: {
          ...deepClone(rowGameUnit),
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
      const rowGameUnit = TestUtil.getDbGameUnit({
        id: rowUnit._id,
        effectiveStrength: 3,
      })
      const horningUnit = TestUtil.getDbUnit({})
      const hornEffect = TestUtil.getDbEffect({
        key: EffectKey.Horn,
      })
      const userId = new ObjectId()
      testApplyHorn({
        hornEffect,
        logPrefix,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: horningUnit._id,
        }),
        rowGameUnit,
        rowUnit,
        unitIdsWithHornInRow: [horningUnit._id.toString()],
        units: [horningUnit],
        currentPlayerId: userId,
        userId: userId,
        expected: {
          [horningUnit._id.toString()]: [
            {
              unit: rowGameUnit,
              user: userId,
            },
          ],
        },
        updatedRowGameUnit: {
          ...deepClone(rowGameUnit),
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
    it('logs to trace if enabled', () => {
      const rowUnit = TestUtil.getDbUnit({})
      const rowGameUnit = TestUtil.getDbGameUnit({
        id: rowUnit._id,
        effectiveStrength: 3,
      })
      const horningUnit = TestUtil.getDbUnit({})
      const hornEffect = TestUtil.getDbEffect({
        key: EffectKey.Horn,
      })
      const userId = new ObjectId()
      const gameUnitEffect: GameUnitEffectDbObject = {
        operator: EFFECT_OPERATOR.Double,
        reason: {
          effect: hornEffect._id,
          type: EffectReasonType.Unit,
          unit: horningUnit._id,
        },
        total: 6,
      }
      const updatedRowGameUnit = {
        ...deepClone(rowGameUnit),
        effectiveStrength: 6,
        effects: [gameUnitEffect],
      }
      const impact: ImpactDbObject = {
        unit: updatedRowGameUnit,
        user: userId,
      }
      testApplyHorn({
        hornEffect,
        logPrefix,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: horningUnit._id,
        }),
        rowGameUnit,
        rowUnit,
        unitIdsWithHornInRow: [horningUnit._id.toString()],
        units: [horningUnit],
        currentPlayerId: userId,
        userId: userId,
        expected: {
          [horningUnit._id.toString()]: [impact],
        },
        updatedRowGameUnit,
        debugCalls: [
          [
            `${logPrefix} adding horn boost to "${rowUnit._id}" from "${horningUnit._id}" for an effectiveStrength of "6"`,
          ],
        ],
        traceEnabled: true,
        traceCalls: [
          [`${logPrefix} rowUnit: "${JSON.stringify(rowUnit)}"`],
          [`${logPrefix} hornsToApply: "${JSON.stringify([horningUnit._id.toString()])}"`],
          [`${logPrefix} gameUnitEffect: "${JSON.stringify(gameUnitEffect)}"`],
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
  rowGameUnit,
  rowUnit,
  units,
  userId = new ObjectId(),
  currentPlayerId,
  expected,
  updatedRowGameUnit,
  debugCalls = [],
  traceCalls = [],
  traceEnabled,
}: {
  logPrefix: string
  unitIdsWithHornInRow: string[]
  hornEffect: EffectDbObject | undefined
  newDeckUnit: DeckUnitDbObject
  rowGameUnit: GameUnitDbObject
  rowUnit: UnitDbObject
  units: UnitDbObject[]
  userId?: ObjectId
  currentPlayerId?: ObjectId | undefined
  expected: ImpactsByUnitId
  updatedRowGameUnit: GameUnitDbObject
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
      rowGameUnit,
      rowUnit,
      unitIdsWithHornInRow,
      units,
      userId,
    })
  ).toEqual(expected)
  expect(rowGameUnit).toEqual(updatedRowGameUnit)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
