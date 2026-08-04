import { ObjectId } from 'mongodb'

import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  FieldUnitDbObject,
  FieldUnitEffectDbObject,
  UnitDbObject,
} from '@gwent-oss/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
import EffectMorale from '../../src/graphql/resolvers/mutations/play-unit/effect-morale'
import { EFFECT_OPERATOR } from '@gwent-oss/constants'
import { EffectReasonType } from '@gwent-oss/graphql-schema'
import { ImpactsByUnitId } from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('effect-morale', () => {
  describe('applyMorales', () => {
    const logPrefix = 'log-prefix'
    it('does nothing if hero', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [moralingUnit._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowFieldUnit.unit,
          hero: true,
        }),
        userId: new ObjectId(),
        units: [moralingUnit],
        expected: {
          [moralingUnit._id.toString()]: [],
        },
        modifiedRowFieldUnit: deepClone(rowFieldUnit),
        debugCalls: [[`${logPrefix} rowUnit "${rowFieldUnit.unit}" is hero so not susceptible to morale effect.`]],
      })
    })
    it('does nothing if rowUnit strength undefined', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [moralingUnit._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowFieldUnit.unit,
          strength: undefined,
        }),
        userId: new ObjectId(),
        units: [moralingUnit],
        expected: {
          [moralingUnit._id.toString()]: [],
        },
        modifiedRowFieldUnit: deepClone(rowFieldUnit),
        debugCalls: [
          [`${logPrefix} rowUnit "${rowFieldUnit.unit}" does not have strength so not susceptible to morale effect.`],
        ],
      })
    })
    it('does nothing if rowUnit strength null', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [moralingUnit._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowFieldUnit.unit,
          strength: null as any,
        }),
        userId: new ObjectId(),
        units: [moralingUnit],
        expected: {
          [moralingUnit._id.toString()]: [],
        },
        modifiedRowFieldUnit: deepClone(rowFieldUnit),
        debugCalls: [
          [`${logPrefix} rowUnit "${rowFieldUnit.unit}" does not have strength so not susceptible to morale effect.`],
        ],
      })
    })
    it('does nothing if moraleIdsInRow empty', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [],
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowFieldUnit.unit,
        }),
        userId: new ObjectId(),
        units: [moralingUnit],
        expected: {},
        modifiedRowFieldUnit: deepClone(rowFieldUnit),
      })
    })
    it('does nothing if rowFieldUnit does not have effects', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        effects: undefined,
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [new ObjectId().toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowFieldUnit.unit,
        }),
        userId: new ObjectId(),
        units: [moralingUnit],
        expected: {},
        modifiedRowFieldUnit: deepClone(rowFieldUnit),
      })
    })
    it('does not morale itself', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        id: moralingUnit._id,
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [moralingUnit._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowFieldUnit.unit,
        }),
        userId: new ObjectId(),
        units: [moralingUnit],
        expected: {
          [moralingUnit._id.toString()]: [],
        },
        modifiedRowFieldUnit: deepClone(rowFieldUnit),
      })
    })
    it('applies single morale to unit that is not newDeckUnit', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [moralingUnit._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowFieldUnit.unit,
          strength: 1,
        }),
        userId: new ObjectId(),
        units: [moralingUnit],
        expected: {
          [moralingUnit._id.toString()]: [],
        },
        modifiedRowFieldUnit: {
          ...deepClone(rowFieldUnit),
          effectiveStrength: 1,
          effects: [
            {
              operator: EFFECT_OPERATOR.Plus,
              reason: {
                effect: moraleEffect._id,
                type: EffectReasonType.Unit,
                unit: moralingUnit._id,
              },
              total: 1,
            },
          ],
        },
        debugCalls: [
          [
            `${logPrefix} adding morale boost to "${rowFieldUnit.unit}" from "${moralingUnit._id}" for an effectiveStrength of "1"`,
          ],
        ],
      })
    })
    it('applies single morale to unit that is newDeckUnit but not by current player', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [moralingUnit._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: moralingUnit._id,
        }),
        rowFieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowFieldUnit.unit,
          strength: 1,
        }),
        userId: new ObjectId(),
        units: [moralingUnit],
        expected: {
          [moralingUnit._id.toString()]: [],
        },
        modifiedRowFieldUnit: {
          ...deepClone(rowFieldUnit),
          effectiveStrength: 1,
          effects: [
            {
              operator: EFFECT_OPERATOR.Plus,
              reason: {
                effect: moraleEffect._id,
                type: EffectReasonType.Unit,
                unit: moralingUnit._id,
              },
              total: 1,
            },
          ],
        },
        debugCalls: [
          [
            `${logPrefix} adding morale boost to "${rowFieldUnit.unit}" from "${moralingUnit._id}" for an effectiveStrength of "1"`,
          ],
        ],
      })
    })
    it('applies multiple morales to unit that is not newDeckUnit', () => {
      const moralingUnit1 = TestUtil.getDbUnit({})
      const moralingUnit2 = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [moralingUnit1._id.toString(), moralingUnit2._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowFieldUnit.unit,
          strength: 1,
        }),
        userId: new ObjectId(),
        units: [moralingUnit1, moralingUnit2],
        expected: {
          [moralingUnit1._id.toString()]: [],
          [moralingUnit2._id.toString()]: [],
        },
        modifiedRowFieldUnit: {
          ...deepClone(rowFieldUnit),
          effectiveStrength: 2,
          effects: [
            {
              operator: EFFECT_OPERATOR.Plus,
              reason: {
                effect: moraleEffect._id,
                type: EffectReasonType.Unit,
                unit: moralingUnit1._id,
              },
              total: 1,
            },
            {
              operator: EFFECT_OPERATOR.Plus,
              reason: {
                effect: moraleEffect._id,
                type: EffectReasonType.Unit,
                unit: moralingUnit2._id,
              },
              total: 2,
            },
          ],
        },
        debugCalls: [
          [
            `${logPrefix} adding morale boost to "${rowFieldUnit.unit}" from "${moralingUnit1._id}" for an effectiveStrength of "1"`,
          ],
          [
            `${logPrefix} adding morale boost to "${rowFieldUnit.unit}" from "${moralingUnit2._id}" for an effectiveStrength of "2"`,
          ],
        ],
      })
    })
    it('applies multiple morales to unit that is newDeckUnit but not current player', () => {
      const moralingUnit1 = TestUtil.getDbUnit({})
      const moralingUnit2 = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [moralingUnit1._id.toString(), moralingUnit2._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: moralingUnit2._id,
        }),
        rowFieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowFieldUnit.unit,
          strength: 2,
        }),
        userId: new ObjectId(),
        units: [moralingUnit1, moralingUnit2],
        expected: {
          [moralingUnit1._id.toString()]: [],
          [moralingUnit2._id.toString()]: [],
        },
        modifiedRowFieldUnit: {
          ...deepClone(rowFieldUnit),
          effectiveStrength: 2,
          effects: [
            {
              operator: EFFECT_OPERATOR.Plus,
              reason: {
                effect: moraleEffect._id,
                type: EffectReasonType.Unit,
                unit: moralingUnit1._id,
              },
              total: 1,
            },
            {
              operator: EFFECT_OPERATOR.Plus,
              reason: {
                effect: moraleEffect._id,
                type: EffectReasonType.Unit,
                unit: moralingUnit2._id,
              },
              total: 2,
            },
          ],
        },
        debugCalls: [
          [
            `${logPrefix} adding morale boost to "${rowFieldUnit.unit}" from "${moralingUnit1._id}" for an effectiveStrength of "1"`,
          ],
          [
            `${logPrefix} adding morale boost to "${rowFieldUnit.unit}" from "${moralingUnit2._id}" for an effectiveStrength of "2"`,
          ],
        ],
      })
    })
    it('applies single morale to unit that is newDeckUnit by current player', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      const effects: FieldUnitEffectDbObject[] = [
        {
          operator: EFFECT_OPERATOR.Plus,
          reason: {
            effect: moraleEffect._id,
            type: EffectReasonType.Unit,
            unit: moralingUnit._id,
          },
          total: 1,
        },
      ]
      const userId = new ObjectId()
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [moralingUnit._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: moralingUnit._id,
        }),
        rowFieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowFieldUnit.unit,
          strength: 1,
        }),
        userId,
        currentPlayerId: userId,
        units: [moralingUnit],
        expected: {
          [moralingUnit._id.toString()]: [
            TestUtil.getDbImpact({
              unit: TestUtil.getDbGameUnit({
                artStyle: rowFieldUnit.artStyle,
                id: rowFieldUnit.unit,
                effectiveStrength: 1,
                effects,
                row: rowFieldUnit.row as Combat,
              }),
              user: userId,
            }),
          ],
        },
        modifiedRowFieldUnit: {
          ...deepClone(rowFieldUnit),
          effectiveStrength: 1,
          effects,
        },
        debugCalls: [
          [
            `${logPrefix} adding morale boost to "${rowFieldUnit.unit}" from "${moralingUnit._id}" for an effectiveStrength of "1"`,
          ],
        ],
      })
    })
    it('applies single morale to unit that is transformedUnit', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      const effects: FieldUnitEffectDbObject[] = [
        {
          operator: EFFECT_OPERATOR.Plus,
          reason: {
            effect: moraleEffect._id,
            type: EffectReasonType.Unit,
            unit: moralingUnit._id,
          },
          total: 1,
        },
      ]
      const userId = new ObjectId()
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [moralingUnit._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowFieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowFieldUnit.unit,
          strength: 1,
        }),
        userId,
        currentPlayerId: userId,
        units: [moralingUnit],
        transformedUnitIds: [moralingUnit._id.toString()],
        expected: {
          [moralingUnit._id.toString()]: [
            TestUtil.getDbImpact({
              unit: TestUtil.getDbGameUnit({
                artStyle: rowFieldUnit.artStyle,
                id: rowFieldUnit.unit,
                effectiveStrength: 1,
                effects,
                row: rowFieldUnit.row as Combat,
              }),
              user: userId,
            }),
          ],
        },
        modifiedRowFieldUnit: {
          ...deepClone(rowFieldUnit),
          effectiveStrength: 1,
          effects,
        },
        debugCalls: [
          [
            `${logPrefix} adding morale boost to "${rowFieldUnit.unit}" from "${moralingUnit._id}" for an effectiveStrength of "1"`,
          ],
        ],
      })
    })
    it('applies multiple morales to unit that is newDeckUnit and current player', () => {
      const moralingUnit1 = TestUtil.getDbUnit({})
      const moralingUnit2 = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      const effects: FieldUnitEffectDbObject[] = [
        {
          operator: EFFECT_OPERATOR.Plus,
          reason: {
            effect: moraleEffect._id,
            type: EffectReasonType.Unit,
            unit: moralingUnit1._id,
          },
          total: 1,
        },
        {
          operator: EFFECT_OPERATOR.Plus,
          reason: {
            effect: moraleEffect._id,
            type: EffectReasonType.Unit,
            unit: moralingUnit2._id,
          },
          total: 2,
        },
      ]
      const userId = new ObjectId()
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [moralingUnit1._id.toString(), moralingUnit2._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: moralingUnit2._id,
        }),
        rowFieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowFieldUnit.unit,
          strength: 2,
        }),
        userId,
        currentPlayerId: userId,
        units: [moralingUnit1, moralingUnit2],
        expected: {
          [moralingUnit1._id.toString()]: [],
          [moralingUnit2._id.toString()]: [
            TestUtil.getDbImpact({
              unit: TestUtil.getDbGameUnit({
                artStyle: rowFieldUnit.artStyle,
                id: rowFieldUnit.unit,
                effectiveStrength: 2,
                effects,
                row: rowFieldUnit.row as Combat,
              }),
              user: userId,
            }),
          ],
        },
        modifiedRowFieldUnit: {
          ...deepClone(rowFieldUnit),
          effectiveStrength: 2,
          effects,
        },
        debugCalls: [
          [
            `${logPrefix} adding morale boost to "${rowFieldUnit.unit}" from "${moralingUnit1._id}" for an effectiveStrength of "1"`,
          ],
          [
            `${logPrefix} adding morale boost to "${rowFieldUnit.unit}" from "${moralingUnit2._id}" for an effectiveStrength of "2"`,
          ],
        ],
      })
    })
    it('applies multiple morales to unit that is newDeckUnit and transformedUnit', () => {
      const moralingUnit1 = TestUtil.getDbUnit({})
      const moralingUnit2 = TestUtil.getDbUnit({})
      const moralingUnit3 = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      const userId = new ObjectId()
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [moralingUnit1._id.toString(), moralingUnit2._id.toString(), moralingUnit3._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: moralingUnit2._id,
        }),
        rowFieldUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowFieldUnit.unit,
          strength: 2,
        }),
        userId,
        currentPlayerId: userId,
        units: [moralingUnit1, moralingUnit2, moralingUnit3],
        transformedUnitIds: [moralingUnit3._id.toString()],
        expected: {
          [moralingUnit1._id.toString()]: [],
          [moralingUnit2._id.toString()]: [
            TestUtil.getDbImpact({
              unit: TestUtil.convertFieldDbUnitToGameDbUnit({
                ...rowFieldUnit,
                effectiveStrength: 2,
              }),
              user: userId,
            }),
          ],
          [moralingUnit3._id.toString()]: [
            TestUtil.getDbImpact({
              unit: TestUtil.convertFieldDbUnitToGameDbUnit({
                ...rowFieldUnit,
                effectiveStrength: 3,
              }),
              user: userId,
            }),
          ],
        },
        modifiedRowFieldUnit: {
          ...deepClone(rowFieldUnit),
          effectiveStrength: 3,
          effects: [
            {
              operator: EFFECT_OPERATOR.Plus,
              reason: {
                effect: moraleEffect._id,
                type: EffectReasonType.Unit,
                unit: moralingUnit1._id,
              },
              total: 1,
            },
            {
              operator: EFFECT_OPERATOR.Plus,
              reason: {
                effect: moraleEffect._id,
                type: EffectReasonType.Unit,
                unit: moralingUnit2._id,
              },
              total: 2,
            },
            {
              operator: EFFECT_OPERATOR.Plus,
              reason: {
                effect: moraleEffect._id,
                type: EffectReasonType.Unit,
                unit: moralingUnit3._id,
              },
              total: 3,
            },
          ],
        },
        debugCalls: [
          [
            `${logPrefix} adding morale boost to "${rowFieldUnit.unit}" from "${moralingUnit1._id}" for an effectiveStrength of "1"`,
          ],
          [
            `${logPrefix} adding morale boost to "${rowFieldUnit.unit}" from "${moralingUnit2._id}" for an effectiveStrength of "2"`,
          ],
          [
            `${logPrefix} adding morale boost to "${rowFieldUnit.unit}" from "${moralingUnit3._id}" for an effectiveStrength of "3"`,
          ],
        ],
      })
    })
    it('logs to trace if enabled', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowFieldUnit = TestUtil.getDbFieldUnit({
        effectiveStrength: 4,
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      const userId = new ObjectId()
      const rowUnit = TestUtil.getDbUnit({
        id: rowFieldUnit.unit,
        strength: 4,
      })

      const effect = {
        operator: EFFECT_OPERATOR.Plus,
        reason: {
          effect: moraleEffect._id,
          type: EffectReasonType.Unit,
          unit: moralingUnit._id,
        },
        total: 5,
      }
      const modifiedRowFieldUnit = {
        ...deepClone(rowFieldUnit),
        effectiveStrength: 5,
        effects: [effect],
      }
      const impact = TestUtil.getDbImpact({
        unit: TestUtil.getDbGameUnit({
          artStyle: rowFieldUnit.artStyle,
          id: rowFieldUnit.unit,
          effectiveStrength: 5,
          effects: [effect],
          row: rowFieldUnit.row as Combat,
        }),
        user: userId,
      })
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [moralingUnit._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: moralingUnit._id,
        }),
        rowFieldUnit,
        rowUnit,
        userId,
        currentPlayerId: userId,
        units: [moralingUnit],
        expected: {
          [moralingUnit._id.toString()]: [impact],
        },
        modifiedRowFieldUnit,
        debugCalls: [
          [
            `${logPrefix} adding morale boost to "${rowFieldUnit.unit}" from "${moralingUnit._id}" for an effectiveStrength of "5"`,
          ],
        ],
        traceEnabled: true,
        traceCalls: [
          [`${logPrefix} rowUnit: "${JSON.stringify(rowUnit)}"`],
          [`${logPrefix} fieldUnitEffect: "${JSON.stringify(effect)}"`],
          [`${logPrefix} impact: "${JSON.stringify(impact)}"`],
        ],
      })
    })
  })
})

function testApplyMorales({
  logPrefix,
  moraleIdsInRow,
  moraleEffect,
  newDeckUnit,
  rowFieldUnit,
  rowUnit,
  units,
  userId,
  currentPlayerId,
  transformedUnitIds = [],
  expected,
  modifiedRowFieldUnit,
  debugCalls = [],
  traceEnabled,
  traceCalls = [],
}: {
  logPrefix: string
  moraleIdsInRow: string[]
  moraleEffect?: EffectDbObject | undefined
  newDeckUnit: DeckUnitDbObject
  rowFieldUnit: FieldUnitDbObject
  rowUnit: UnitDbObject
  units: UnitDbObject[]
  userId: ObjectId
  currentPlayerId?: ObjectId | undefined
  transformedUnitIds?: string[]
  expected: ImpactsByUnitId
  modifiedRowFieldUnit: FieldUnitDbObject
  debugCalls?: string[][]
  traceEnabled?: boolean
  traceCalls?: string[][]
}) {
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  EffectMorale['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  expect(
    EffectMorale.applyMorales({
      logPrefix,
      moraleEffect,
      unitIdsWithMoraleInRow: moraleIdsInRow,
      newDeckUnit,
      rowFieldUnit,
      rowUnit,
      units,
      userId,
      currentPlayerId,
      transformedUnitIds,
    })
  ).toEqual(expected)

  expect(rowFieldUnit).toEqual(modifiedRowFieldUnit)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
