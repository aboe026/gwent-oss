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
import { EffectReasonType } from '@gwent/graphql-schema'
import { ImpactsByUnitId } from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('effect-morale', () => {
  const logPrefix = 'log-prefix'
  describe('getUnitsWithMorale', () => {
    it('returns empty array if no moraleEffect', () => {
      testGetUnitsWithMorale({
        logPrefix,
        moraleEffect: undefined,
        units: [],
        expected: [],
      })
    })
    it('returns empty string if unit does not have effects', () => {
      testGetUnitsWithMorale({
        logPrefix,
        moraleEffect: TestUtil.getDbEffect({}),
        units: [TestUtil.getDbUnit({})],
        expected: [],
      })
    })
    it('returns empty string if unit has effect but not morale', () => {
      testGetUnitsWithMorale({
        logPrefix,
        moraleEffect: TestUtil.getDbEffect({}),
        units: [
          TestUtil.getDbUnit({
            effects: [new ObjectId()],
          }),
        ],
        expected: [],
      })
    })
    it('returns single id if single unit has single morale', () => {
      const moraleEffectId = new ObjectId()
      const unit = TestUtil.getDbUnit({
        effects: [moraleEffectId],
      })
      testGetUnitsWithMorale({
        logPrefix,
        moraleEffect: TestUtil.getDbEffect({
          id: moraleEffectId,
        }),
        units: [unit],
        expected: [unit._id.toString()],
        debugCalls: [[`${logPrefix} unit "${unit._id}" has morale effect "${moraleEffectId}"`]],
      })
    })
    it('returns single id if single unit has multiple morales', () => {
      const moraleEffectId = new ObjectId()
      const unit = TestUtil.getDbUnit({
        effects: [moraleEffectId, moraleEffectId],
      })
      testGetUnitsWithMorale({
        logPrefix,
        moraleEffect: TestUtil.getDbEffect({
          id: moraleEffectId,
        }),
        units: [unit],
        expected: [unit._id.toString()],
        debugCalls: [[`${logPrefix} unit "${unit._id}" has morale effect "${moraleEffectId}"`]],
      })
    })
    it('returns single id if single unit out of many has single morale', () => {
      const moraleEffectId = new ObjectId()
      const unit = TestUtil.getDbUnit({
        effects: [moraleEffectId],
      })
      testGetUnitsWithMorale({
        logPrefix,
        moraleEffect: TestUtil.getDbEffect({
          id: moraleEffectId,
        }),
        units: [TestUtil.getDbUnit({}), unit, TestUtil.getDbUnit({})],
        expected: [unit._id.toString()],
        debugCalls: [[`${logPrefix} unit "${unit._id}" has morale effect "${moraleEffectId}"`]],
      })
    })
    it('returns multiple ids if multiple units with single morale', () => {
      const moraleEffectId = new ObjectId()
      const unit1 = TestUtil.getDbUnit({
        effects: [moraleEffectId],
      })
      const unit2 = TestUtil.getDbUnit({
        effects: [moraleEffectId],
      })
      testGetUnitsWithMorale({
        logPrefix,
        moraleEffect: TestUtil.getDbEffect({
          id: moraleEffectId,
        }),
        units: [unit1, unit2],
        expected: [unit1._id.toString(), unit2._id.toString()],
        debugCalls: [
          [`${logPrefix} unit "${unit1._id}" has morale effect "${moraleEffectId}"`],
          [`${logPrefix} unit "${unit2._id}" has morale effect "${moraleEffectId}"`],
        ],
      })
    })
    it('returns multiple ids if multiple units with multiple morales', () => {
      const moraleEffectId = new ObjectId()
      const unit1 = TestUtil.getDbUnit({
        effects: [moraleEffectId, moraleEffectId],
      })
      const unit2 = TestUtil.getDbUnit({
        effects: [moraleEffectId, moraleEffectId],
      })
      testGetUnitsWithMorale({
        logPrefix,
        moraleEffect: TestUtil.getDbEffect({
          id: moraleEffectId,
        }),
        units: [unit1, unit2],
        expected: [unit1._id.toString(), unit2._id.toString()],
        debugCalls: [
          [`${logPrefix} unit "${unit1._id}" has morale effect "${moraleEffectId}"`],
          [`${logPrefix} unit "${unit2._id}" has morale effect "${moraleEffectId}"`],
        ],
      })
    })
    it('returns multiple ids if multiple units out of many with single morale', () => {
      const moraleEffectId = new ObjectId()
      const unit1 = TestUtil.getDbUnit({
        effects: [moraleEffectId],
      })
      const unit2 = TestUtil.getDbUnit({
        effects: [moraleEffectId],
      })
      testGetUnitsWithMorale({
        logPrefix,
        moraleEffect: TestUtil.getDbEffect({
          id: moraleEffectId,
        }),
        units: [
          TestUtil.getDbUnit({
            effects: [new ObjectId()],
          }),
          unit1,
          unit2,
          TestUtil.getDbUnit({}),
        ],
        expected: [unit1._id.toString(), unit2._id.toString()],
        debugCalls: [
          [`${logPrefix} unit "${unit1._id}" has morale effect "${moraleEffectId}"`],
          [`${logPrefix} unit "${unit2._id}" has morale effect "${moraleEffectId}"`],
        ],
      })
    })
    it('logs to trace if enabled', () => {
      const moraleEffectId = new ObjectId()
      const unit = TestUtil.getDbUnit({
        effects: [moraleEffectId],
      })
      testGetUnitsWithMorale({
        logPrefix,
        moraleEffect: TestUtil.getDbEffect({
          id: moraleEffectId,
        }),
        units: [unit],
        expected: [unit._id.toString()],
        debugCalls: [[`${logPrefix} unit "${unit._id}" has morale effect "${moraleEffectId}"`]],
        traceEnabled: true,
      })
    })
  })
  describe('applyMorales', () => {
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
              operator: '+1',
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
              operator: '+1',
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
              operator: '+1',
              reason: {
                effect: moraleEffect._id,
                type: EffectReasonType.Unit,
                unit: moralingUnit1._id,
              },
              total: 1,
            },
            {
              operator: '+1',
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
              operator: '+1',
              reason: {
                effect: moraleEffect._id,
                type: EffectReasonType.Unit,
                unit: moralingUnit1._id,
              },
              total: 1,
            },
            {
              operator: '+1',
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
              operator: '+1',
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
              operator: '+1',
              reason: {
                effect: moraleEffect._id,
                type: EffectReasonType.Unit,
                unit: moralingUnit1._id,
              },
              total: 1,
            },
            {
              operator: '+1',
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
        operator: '+1',
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

function testGetUnitsWithMorale({
  logPrefix,
  moraleEffect,
  units,
  expected,
  debugCalls = [],
  traceEnabled,
}: {
  logPrefix: string
  moraleEffect: EffectDbObject | undefined
  units: UnitDbObject[]
  expected: string[]
  debugCalls?: string[][]
  traceEnabled?: boolean
}) {
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  EffectMorale['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  expect(
    EffectMorale.getUnitsWithMorale({
      logPrefix,
      moraleEffect,
      units,
    })
  ).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} moraleEffect: "${JSON.stringify(moraleEffect)}"`],
          [`${logPrefix} units: "${JSON.stringify(units)}"`],
          [`${logPrefix} unitIdsWithMorale: "${JSON.stringify(expected)}"`],
        ]
      : []
  )
}

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
    })
  ).toEqual(expected)

  expect(rowGameUnit).toEqual(modifiedRowGameUnit)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
