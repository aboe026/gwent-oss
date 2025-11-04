import { ObjectId } from 'mongodb'

import {
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameUnitDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
import EffectMorale from '../../src/graphql/resolvers/mutations/play-unit/effect-morale'
import { EFFECT_OPERATOR } from '@gwent/constants'
import { EffectReasonType } from '@gwent/graphql-schema'
import { ImpactsByUnitId } from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('effect-morale', () => {
  describe('applyMorales', () => {
    const logPrefix = 'log-prefix'
    it('does nothing if hero', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowGameUnit = TestUtil.getDbGameUnit({
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
        rowGameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowGameUnit.unit,
          hero: true,
        }),
        userId: new ObjectId(),
        units: [moralingUnit],
        expected: {},
        modifiedRowGameUnit: deepClone(rowGameUnit),
        debugCalls: [[`${logPrefix} rowUnit "${rowGameUnit.unit}" is hero so not susceptible to morale effect.`]],
      })
    })
    it('does nothing if moraleIdsInRow empty', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowGameUnit = TestUtil.getDbGameUnit({
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
        rowGameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowGameUnit.unit,
        }),
        userId: new ObjectId(),
        units: [moralingUnit],
        expected: {},
        modifiedRowGameUnit: deepClone(rowGameUnit),
      })
    })
    it('does nothing if rowGameUnit does not have effects', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowGameUnit = TestUtil.getDbGameUnit({
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
        rowGameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowGameUnit.unit,
        }),
        userId: new ObjectId(),
        units: [moralingUnit],
        expected: {},
        modifiedRowGameUnit: deepClone(rowGameUnit),
      })
    })
    it('does not morale itself', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowGameUnit = TestUtil.getDbGameUnit({
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
        rowGameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowGameUnit.unit,
        }),
        userId: new ObjectId(),
        units: [moralingUnit],
        expected: {},
        modifiedRowGameUnit: deepClone(rowGameUnit),
      })
    })
    it('applies single morale to unit that is not newDeckUnit', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowGameUnit = TestUtil.getDbGameUnit({
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
        rowGameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowGameUnit.unit,
        }),
        userId: new ObjectId(),
        units: [moralingUnit],
        expected: {},
        modifiedRowGameUnit: {
          ...deepClone(rowGameUnit),
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
            `${logPrefix} adding morale boost to "${rowGameUnit.unit}" from "${moralingUnit._id}" for an effectiveStrength of "1"`,
          ],
        ],
      })
    })
    it('applies single morale to unit that is newDeckUnit but not by current player', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowGameUnit = TestUtil.getDbGameUnit({
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
        rowGameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowGameUnit.unit,
        }),
        userId: new ObjectId(),
        units: [moralingUnit],
        expected: {},
        modifiedRowGameUnit: {
          ...deepClone(rowGameUnit),
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
            `${logPrefix} adding morale boost to "${rowGameUnit.unit}" from "${moralingUnit._id}" for an effectiveStrength of "1"`,
          ],
        ],
      })
    })
    it('applies multiple morales to unit that is not newDeckUnit', () => {
      const moralingUnit1 = TestUtil.getDbUnit({})
      const moralingUnit2 = TestUtil.getDbUnit({})
      const rowGameUnit = TestUtil.getDbGameUnit({
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
        rowGameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowGameUnit.unit,
        }),
        userId: new ObjectId(),
        units: [moralingUnit1, moralingUnit2],
        expected: {},
        modifiedRowGameUnit: {
          ...deepClone(rowGameUnit),
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
            `${logPrefix} adding morale boost to "${rowGameUnit.unit}" from "${moralingUnit1._id}" for an effectiveStrength of "1"`,
          ],
          [
            `${logPrefix} adding morale boost to "${rowGameUnit.unit}" from "${moralingUnit2._id}" for an effectiveStrength of "2"`,
          ],
        ],
      })
    })
    it('applies multiple morales to unit that is newDeckUnit but not current player', () => {
      const moralingUnit1 = TestUtil.getDbUnit({})
      const moralingUnit2 = TestUtil.getDbUnit({})
      const rowGameUnit = TestUtil.getDbGameUnit({
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
        rowGameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowGameUnit.unit,
        }),
        userId: new ObjectId(),
        units: [moralingUnit1, moralingUnit2],
        expected: {},
        modifiedRowGameUnit: {
          ...deepClone(rowGameUnit),
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
            `${logPrefix} adding morale boost to "${rowGameUnit.unit}" from "${moralingUnit1._id}" for an effectiveStrength of "1"`,
          ],
          [
            `${logPrefix} adding morale boost to "${rowGameUnit.unit}" from "${moralingUnit2._id}" for an effectiveStrength of "2"`,
          ],
        ],
      })
    })
    it('applies single morale to unit that is newDeckUnit by current player', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowGameUnit = TestUtil.getDbGameUnit({
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      const userId = new ObjectId()
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [moralingUnit._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: moralingUnit._id,
        }),
        rowGameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowGameUnit.unit,
        }),
        userId,
        currentPlayerId: userId,
        units: [moralingUnit],
        expected: {
          [moralingUnit._id.toString()]: [
            {
              unit: rowGameUnit,
              user: userId,
            },
          ],
        },
        modifiedRowGameUnit: {
          ...deepClone(rowGameUnit),
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
            `${logPrefix} adding morale boost to "${rowGameUnit.unit}" from "${moralingUnit._id}" for an effectiveStrength of "1"`,
          ],
        ],
      })
    })
    it('applies single morale to unit that is transformedUnit', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowGameUnit = TestUtil.getDbGameUnit({
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      const userId = new ObjectId()
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [moralingUnit._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        rowGameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowGameUnit.unit,
        }),
        userId,
        currentPlayerId: userId,
        units: [moralingUnit],
        transformedUnitIds: [moralingUnit._id.toString()],
        expected: {
          [moralingUnit._id.toString()]: [
            {
              unit: rowGameUnit,
              user: userId,
            },
          ],
        },
        modifiedRowGameUnit: {
          ...deepClone(rowGameUnit),
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
            `${logPrefix} adding morale boost to "${rowGameUnit.unit}" from "${moralingUnit._id}" for an effectiveStrength of "1"`,
          ],
        ],
      })
    })
    it('applies multiple morales to unit that is newDeckUnit and current player', () => {
      const moralingUnit1 = TestUtil.getDbUnit({})
      const moralingUnit2 = TestUtil.getDbUnit({})
      const rowGameUnit = TestUtil.getDbGameUnit({
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      const userId = new ObjectId()
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [moralingUnit1._id.toString(), moralingUnit2._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: moralingUnit2._id,
        }),
        rowGameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowGameUnit.unit,
        }),
        userId,
        currentPlayerId: userId,
        units: [moralingUnit1, moralingUnit2],
        expected: {
          [moralingUnit2._id.toString()]: [
            {
              unit: rowGameUnit,
              user: userId,
            },
          ],
        },
        modifiedRowGameUnit: {
          ...deepClone(rowGameUnit),
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
            `${logPrefix} adding morale boost to "${rowGameUnit.unit}" from "${moralingUnit1._id}" for an effectiveStrength of "1"`,
          ],
          [
            `${logPrefix} adding morale boost to "${rowGameUnit.unit}" from "${moralingUnit2._id}" for an effectiveStrength of "2"`,
          ],
        ],
      })
    })
    it('applies multiple morales to unit that is newDeckUnit and transformedUnit', () => {
      const moralingUnit1 = TestUtil.getDbUnit({})
      const moralingUnit2 = TestUtil.getDbUnit({})
      const moralingUnit3 = TestUtil.getDbUnit({})
      const rowGameUnit = TestUtil.getDbGameUnit({
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
        rowGameUnit,
        rowUnit: TestUtil.getDbUnit({
          id: rowGameUnit.unit,
        }),
        userId,
        currentPlayerId: userId,
        units: [moralingUnit1, moralingUnit2, moralingUnit3],
        transformedUnitIds: [moralingUnit3._id.toString()],
        expected: {
          [moralingUnit2._id.toString()]: [
            {
              unit: rowGameUnit,
              user: userId,
            },
          ],
          [moralingUnit3._id.toString()]: [
            {
              unit: rowGameUnit,
              user: userId,
            },
          ],
        },
        modifiedRowGameUnit: {
          ...deepClone(rowGameUnit),
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
            `${logPrefix} adding morale boost to "${rowGameUnit.unit}" from "${moralingUnit1._id}" for an effectiveStrength of "1"`,
          ],
          [
            `${logPrefix} adding morale boost to "${rowGameUnit.unit}" from "${moralingUnit2._id}" for an effectiveStrength of "2"`,
          ],
          [
            `${logPrefix} adding morale boost to "${rowGameUnit.unit}" from "${moralingUnit3._id}" for an effectiveStrength of "3"`,
          ],
        ],
      })
    })
    it('logs to trace if enabled', () => {
      const moralingUnit = TestUtil.getDbUnit({})
      const rowGameUnit = TestUtil.getDbGameUnit({
        effectiveStrength: 4,
        effects: [],
      })
      const moraleEffect = TestUtil.getDbEffect({
        key: EffectKey.Morale,
      })
      const userId = new ObjectId()
      const rowUnit = TestUtil.getDbUnit({
        id: rowGameUnit.unit,
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
      const modifiedRowGameUnit = {
        ...deepClone(rowGameUnit),
        effectiveStrength: 5,
        effects: [effect],
      }
      testApplyMorales({
        logPrefix,
        moraleEffect,
        moraleIdsInRow: [moralingUnit._id.toString()],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: moralingUnit._id,
        }),
        rowGameUnit,
        rowUnit,
        userId,
        currentPlayerId: userId,
        units: [moralingUnit],
        expected: {
          [moralingUnit._id.toString()]: [
            {
              unit: rowGameUnit,
              user: userId,
            },
          ],
        },
        modifiedRowGameUnit,
        debugCalls: [
          [
            `${logPrefix} adding morale boost to "${rowGameUnit.unit}" from "${moralingUnit._id}" for an effectiveStrength of "5"`,
          ],
        ],
        traceEnabled: true,
        traceCalls: [
          [`${logPrefix} rowUnit: "${JSON.stringify(rowUnit)}"`],
          [`${logPrefix} moralesToApply: "${JSON.stringify([moralingUnit._id.toString()])}"`],
          [`${logPrefix} gameUnitEffect: "${JSON.stringify(effect)}"`],
          [
            `${logPrefix} impact: "${JSON.stringify({
              unit: modifiedRowGameUnit,
              user: userId,
            })}"`,
          ],
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
  rowGameUnit,
  rowUnit,
  units,
  userId,
  currentPlayerId,
  transformedUnitIds = [],
  expected,
  modifiedRowGameUnit,
  debugCalls = [],
  traceEnabled,
  traceCalls = [],
}: {
  logPrefix: string
  moraleIdsInRow: string[]
  moraleEffect?: EffectDbObject | undefined
  newDeckUnit: DeckUnitDbObject
  rowGameUnit: GameUnitDbObject
  rowUnit: UnitDbObject
  units: UnitDbObject[]
  userId: ObjectId
  currentPlayerId?: ObjectId | undefined
  transformedUnitIds?: string[]
  expected: ImpactsByUnitId
  modifiedRowGameUnit: GameUnitDbObject
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
      rowGameUnit,
      rowUnit,
      units,
      userId,
      currentPlayerId,
      transformedUnitIds,
    })
  ).toEqual(expected)

  expect(rowGameUnit).toEqual(modifiedRowGameUnit)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
