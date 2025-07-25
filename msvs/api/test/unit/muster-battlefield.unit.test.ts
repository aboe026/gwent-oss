import { ObjectId } from 'mongodb'

import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  GameUnitOrigin,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import GetEffectWithKey from '../../src/graphql/resolvers/mutations/play-unit/get-effect-with-key'
import MusterBattlefield, {
  MusterForPlayer,
  Musterings,
} from '../../src/graphql/resolvers/mutations/play-unit/muster-battlefield'
import TestUtil from '../util/test-util'
import UnitStore from '../../src/database/stores/unit-store'

describe('muster-battlefield', () => {
  describe('musterBattlefield', () => {
    const logPrefix = 'log-prefix'
    const game = TestUtil.getDbGame({})
    it('throws error if newDeckUnit not apart of battlefieldUnits', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const message = `Could not find unit for new deck unit "${newDeckUnit.unit}"`
      await testMusterBattlefield({
        logPrefix,
        game,
        battlefieldUnits: [],
        newDeckUnit,
        expected: Error(`${message}.`),
        errorCalls: [[`${logPrefix} failed: ${message}, battlefieldUnits: "[]"`]],
      })
    })
    it('returns empty values if no effect with muster', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      await testMusterBattlefield({
        logPrefix,
        game,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        newDeckUnit,
        expected: {
          impacts: undefined,
          musteredUnits: [],
          musteredOrigins: {},
        },
      })
    })
    it('returns empty values if musterEffect but newUnit does not have effects', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      await testMusterBattlefield({
        logPrefix,
        game,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        newDeckUnit,
        musterEffect: TestUtil.getDbEffect({}),
        expected: {
          impacts: undefined,
          musteredUnits: [],
          musteredOrigins: {},
        },
      })
    })
    it('returns empty values if musterEffect but newUnit does not have muster effect', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      await testMusterBattlefield({
        logPrefix,
        game,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
            effects: [new ObjectId()],
          }),
        ],
        newDeckUnit,
        musterEffect: TestUtil.getDbEffect({}),
        expected: {
          impacts: undefined,
          musteredUnits: [],
          musteredOrigins: {},
        },
      })
    })
    it('returns empty values if musterUnitForCurrentPlayer returns empty values', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const musterEffect = TestUtil.getDbEffect({})
      const newUnit = TestUtil.getDbUnit({
        id: newDeckUnit.unit,
        effects: [musterEffect._id],
      })
      const musterableUnit = TestUtil.getDbUnit({})
      const impact = TestUtil.getDbImpact({
        unit: TestUtil.getDbGameUnit({
          id: musterableUnit._id,
        }),
      })
      await testMusterBattlefield({
        logPrefix,
        game,
        battlefieldUnits: [newUnit],
        newDeckUnit,
        musterEffect,
        musterableUnits: [musterableUnit],
        musterUnitForCurrentPlayerResponses: [
          {
            impact: undefined,
            origin: undefined,
          },
        ],
        expected: {
          impacts: undefined,
          musteredUnits: [],
          musteredOrigins: {},
        },
        unitStoreGetCalls: [
          [
            {
              namePrefix: undefined,
              names: [newUnit.name],
              ignoreIds: [newUnit._id],
            },
          ],
        ],
        musterUnitForCurrentPlayerCalls: [
          [
            {
              combat: undefined,
              game,
              logPrefix,
              potentialMuster: musterableUnit,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} unit "${newUnit.name}" has muster effect, applying it`]],
      })
    })
    it('returns values for single muster without effectPrefix', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const musterEffect = TestUtil.getDbEffect({})
      const newUnit = TestUtil.getDbUnit({
        id: newDeckUnit.unit,
        effects: [musterEffect._id],
      })
      const musterableUnit = TestUtil.getDbUnit({})
      const impact = TestUtil.getDbImpact({
        unit: TestUtil.getDbGameUnit({
          id: musterableUnit._id,
        }),
      })
      await testMusterBattlefield({
        logPrefix,
        game,
        battlefieldUnits: [newUnit],
        newDeckUnit,
        musterEffect,
        musterableUnits: [musterableUnit],
        musterUnitForCurrentPlayerResponses: [
          {
            impact,
            origin: GameUnitOrigin.Hand,
          },
        ],
        expected: {
          impacts: [impact],
          musteredUnits: [musterableUnit],
          musteredOrigins: {
            [musterableUnit._id.toString()]: GameUnitOrigin.Hand,
          },
        },
        unitStoreGetCalls: [
          [
            {
              namePrefix: undefined,
              names: [newUnit.name],
              ignoreIds: [newUnit._id],
            },
          ],
        ],
        musterUnitForCurrentPlayerCalls: [
          [
            {
              combat: undefined,
              game,
              logPrefix,
              potentialMuster: musterableUnit,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} unit "${newUnit.name}" has muster effect, applying it`]],
      })
    })
    it('returns values for single muster with effectPrefix and combat', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const musterEffect = TestUtil.getDbEffect({})
      const newUnit = TestUtil.getDbUnit({
        id: newDeckUnit.unit,
        effects: [musterEffect._id],
        effectPrefix: 'effect-prefix',
      })
      const musterableUnit = TestUtil.getDbUnit({
        combats: [Combat.Close],
      })
      const impact = TestUtil.getDbImpact({
        unit: TestUtil.getDbGameUnit({
          id: musterableUnit._id,
        }),
      })
      await testMusterBattlefield({
        logPrefix,
        game,
        battlefieldUnits: [newUnit],
        newDeckUnit,
        musterEffect,
        musterableUnits: [musterableUnit],
        musterUnitForCurrentPlayerResponses: [
          {
            impact,
            origin: GameUnitOrigin.Undrawn,
          },
        ],
        expected: {
          impacts: [impact],
          musteredUnits: [musterableUnit],
          musteredOrigins: {
            [musterableUnit._id.toString()]: GameUnitOrigin.Undrawn,
          },
        },
        unitStoreGetCalls: [
          [
            {
              namePrefix: 'effect-prefix',
              names: undefined,
              ignoreIds: [newUnit._id],
            },
          ],
        ],
        musterUnitForCurrentPlayerCalls: [
          [
            {
              combat: Combat.Close,
              game,
              logPrefix,
              potentialMuster: musterableUnit,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} unit "${newUnit.name}" has muster effect, applying it`]],
      })
    })
    it('returns values for multiple musters and sorts by origin', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const musterEffect = TestUtil.getDbEffect({})
      const newUnit = TestUtil.getDbUnit({
        id: newDeckUnit.unit,
        effects: [musterEffect._id],
      })
      const musterableUnit1 = TestUtil.getDbUnit({})
      const impact1 = TestUtil.getDbImpact({
        unit: TestUtil.getDbGameUnit({
          id: musterableUnit1._id,
        }),
        source: {
          origin: GameUnitOrigin.Undrawn,
        },
      })
      const musterableUnit2 = TestUtil.getDbUnit({})
      const impact2 = TestUtil.getDbImpact({
        unit: TestUtil.getDbGameUnit({
          id: musterableUnit2._id,
        }),
        source: {
          origin: GameUnitOrigin.Hand,
        },
      })
      await testMusterBattlefield({
        logPrefix,
        game,
        battlefieldUnits: [newUnit],
        newDeckUnit,
        musterEffect,
        musterableUnits: [musterableUnit1, musterableUnit2],
        musterUnitForCurrentPlayerResponses: [
          {
            impact: impact1,
            origin: GameUnitOrigin.Undrawn,
          },
          {
            impact: impact2,
            origin: GameUnitOrigin.Hand,
          },
        ],
        expected: {
          impacts: [impact2, impact1],
          musteredUnits: [musterableUnit1, musterableUnit2],
          musteredOrigins: {
            [musterableUnit1._id.toString()]: GameUnitOrigin.Undrawn,
            [musterableUnit2._id.toString()]: GameUnitOrigin.Hand,
          },
        },
        unitStoreGetCalls: [
          [
            {
              namePrefix: undefined,
              names: [newUnit.name],
              ignoreIds: [newUnit._id],
            },
          ],
        ],
        musterUnitForCurrentPlayerCalls: [
          [
            {
              combat: undefined,
              game,
              logPrefix,
              potentialMuster: musterableUnit1,
            },
          ],
          [
            {
              combat: undefined,
              game,
              logPrefix,
              potentialMuster: musterableUnit2,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} unit "${newUnit.name}" has muster effect, applying it`]],
      })
    })
    it('logs to trace if enabled', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const musterEffect = TestUtil.getDbEffect({})
      const newUnit = TestUtil.getDbUnit({
        id: newDeckUnit.unit,
        effects: [musterEffect._id],
      })
      const musterableUnit = TestUtil.getDbUnit({})
      const impact = TestUtil.getDbImpact({
        unit: TestUtil.getDbGameUnit({
          id: musterableUnit._id,
        }),
      })
      await testMusterBattlefield({
        logPrefix,
        game,
        battlefieldUnits: [newUnit],
        newDeckUnit,
        musterEffect,
        musterableUnits: [musterableUnit],
        musterUnitForCurrentPlayerResponses: [
          {
            impact: undefined,
            origin: undefined,
          },
        ],
        expected: {
          impacts: undefined,
          musteredUnits: [],
          musteredOrigins: {},
        },
        unitStoreGetCalls: [
          [
            {
              namePrefix: undefined,
              names: [newUnit.name],
              ignoreIds: [newUnit._id],
            },
          ],
        ],
        musterUnitForCurrentPlayerCalls: [
          [
            {
              combat: undefined,
              game,
              logPrefix,
              potentialMuster: musterableUnit,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} unit "${newUnit.name}" has muster effect, applying it`]],
        traceCalls: [
          [`${logPrefix} newUnit: "${JSON.stringify(newUnit)}"`],
          [`${logPrefix} musterEffect: "${JSON.stringify(musterEffect)}"`],
          [`${logPrefix} hasMusterEffect: "true"`],
          [`${logPrefix} musterableUnits: "${JSON.stringify([musterableUnit])}"`],
        ],
        traceEnabled: true,
      })
    })
  })
  describe('musterUnitForCurrentPlayer', () => {
    const logPrefix = 'log-prefix'
    it('throws error if potential muster found in both hand and undrawn', () => {
      const potentialMuster = TestUtil.getDbUnit({})
      const player = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          hand: [
            TestUtil.getDbDeckUnit({
              id: potentialMuster._id,
            }),
          ],
          undrawn: [
            TestUtil.getDbDeckUnit({
              id: potentialMuster._id,
            }),
          ],
        }),
      })
      const message = `Unit "${potentialMuster._id}" found in both hand and undrawn`
      testMusterUnitForCurrentPlayer({
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
        }),
        potentialMuster,
        logPrefix,
        expected: Error(`${message}.`),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns undefineds if no unit to muster', () => {
      const potentialMuster = TestUtil.getDbUnit({})
      const player = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({}),
      })
      testMusterUnitForCurrentPlayer({
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
        }),
        potentialMuster,
        logPrefix,
        expected: {
          impact: undefined,
          origin: undefined,
        },
      })
    })
  })
})

async function testMusterBattlefield({
  battlefieldUnits,
  logPrefix,
  game,
  newDeckUnit,
  musterEffect,
  musterableUnits = [],
  musterUnitForCurrentPlayerResponses = [],
  expected,
  unitStoreGetCalls = [],
  musterUnitForCurrentPlayerCalls = [],
  errorCalls = [],
  debugCalls = [],
  traceCalls = [],
  traceEnabled,
}: {
  battlefieldUnits: UnitDbObject[]
  logPrefix: string
  game: GameDbObject
  newDeckUnit: DeckUnitDbObject
  musterEffect?: EffectDbObject
  musterableUnits?: UnitDbObject[]
  musterUnitForCurrentPlayerResponses?: MusterForPlayer[]
  expected: Musterings | Error
  unitStoreGetCalls?: any[][]
  musterUnitForCurrentPlayerCalls?: any[][]
  errorCalls?: string[][]
  debugCalls?: string[][]
  traceCalls?: string[][]
  traceEnabled?: boolean
}) {
  const effects = [TestUtil.getDbEffect({})]
  const getEffectWithKeySpy = jest.spyOn(GetEffectWithKey, 'getEffectWithKey').mockReturnValue(musterEffect)
  const unitStoreGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue(musterableUnits)
  const musterUnitForCurrentPlayerSpy = jest.spyOn(MusterBattlefield as any, 'musterUnitForCurrentPlayer')
  for (const musterUnitForCurrentPlayerResponse of musterUnitForCurrentPlayerResponses) {
    musterUnitForCurrentPlayerSpy.mockReturnValueOnce(musterUnitForCurrentPlayerResponse)
  }
  const errorSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  MusterBattlefield['logger'] = {
    error: errorSpy,
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = MusterBattlefield.musterBattlefield({
    battlefieldUnits,
    effects,
    game,
    logPrefix,
    newDeckUnit,
  })
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(getEffectWithKeySpy.mock.calls).toEqual(
    expected instanceof Error
      ? []
      : [
          [
            {
              effectKey: EffectKey.Muster,
              effects,
              logPrefix,
            },
          ],
        ]
  )
  expect(unitStoreGetSpy.mock.calls).toEqual(unitStoreGetCalls)
  expect(musterUnitForCurrentPlayerSpy.mock.calls).toEqual(musterUnitForCurrentPlayerCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}

async function testMusterUnitForCurrentPlayer({
  combat,
  game,
  logPrefix,
  potentialMuster,
  expected,
  errorCalls = [],
  traceEnabled,
}: {
  combat?: Combat | null
  game: GameDbObject
  logPrefix: string
  potentialMuster: UnitDbObject
  expected: MusterForPlayer | Error
  errorCalls?: string[][]
  traceEnabled?: boolean
}) {
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  MusterBattlefield['logger'] = {
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  if (expected instanceof Error) {
    expect(() =>
      MusterBattlefield['musterUnitForCurrentPlayer']({
        game,
        logPrefix,
        potentialMuster,
        combat,
      })
    ).toThrow(expected)
  } else {
    expect(
      MusterBattlefield['musterUnitForCurrentPlayer']({
        game,
        logPrefix,
        potentialMuster,
        combat,
      })
    ).toEqual(expected)
  }

  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [] : [])
}
