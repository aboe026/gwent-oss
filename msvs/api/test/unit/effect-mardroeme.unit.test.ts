import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  GameUnitDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import EffectMardroeme, {
  Transformations,
  TransformPairs,
} from '../../src/graphql/resolvers/mutations/play-unit/effect-mardroeme'
import GetEffectWithKey from '../../src/graphql/resolvers/mutations/play-unit/get-effect-with-key'
import TestUtil from '../util/test-util'
import * as getGameUnits from '../../src/graphql/resolvers/mutations/play-unit/get-game-units'
import { ObjectId } from 'mongodb'

describe('effect-mardroeme', () => {
  describe('transformBerserkers', () => {
    const logPrefix = 'log-prefix'
    it('does nothing if game turn is not player', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({}),
        newDeckUnit,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        expected: {
          impacts: {},
          mardroemingGameUnit: undefined,
          transformedGameUnits: [],
          transformedUnits: [],
        },
      })
    })
    it('does nothing if mardroeme effect not present', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        getEffectWithKeyResponses: [
          undefined,
          TestUtil.getDbEffect({
            key: EffectKey.Berserker,
          }),
        ],
        expected: {
          impacts: {},
          mardroemingGameUnit: undefined,
          transformedGameUnits: [],
          transformedUnits: [],
        },
      })
    })
    it('does nothing if berserker effect not present', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        getEffectWithKeyResponses: [
          TestUtil.getDbEffect({
            key: EffectKey.Mardroeme,
          }),
        ],
        expected: {
          impacts: {},
          mardroemingGameUnit: undefined,
          transformedGameUnits: [],
          transformedUnits: [],
        },
      })
    })
    it('does nothing if no mardroeme units', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const unit = TestUtil.getDbUnit({})
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        getEffectWithKeyResponses: [
          TestUtil.getDbEffect({
            key: EffectKey.Mardroeme,
          }),
          TestUtil.getDbEffect({
            key: EffectKey.Berserker,
          }),
        ],
        getGameUnitsResponse: [
          TestUtil.getDbGameUnit({
            id: unit._id,
          }),
        ],
        getUnitsWithEffectResponses: [[], [unit]],
        expected: {
          impacts: {},
          mardroemingGameUnit: undefined,
          transformedGameUnits: [],
          transformedUnits: [],
        },
      })
    })
    it('does nothing if no berserker units', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const unit = TestUtil.getDbUnit({})
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        getEffectWithKeyResponses: [
          TestUtil.getDbEffect({
            key: EffectKey.Mardroeme,
          }),
          TestUtil.getDbEffect({
            key: EffectKey.Berserker,
          }),
        ],
        getGameUnitsResponse: [
          TestUtil.getDbGameUnit({
            id: unit._id,
          }),
        ],
        getUnitsWithEffectResponses: [[unit], []],
        expected: {
          impacts: {},
          mardroemingGameUnit: undefined,
          transformedGameUnits: [],
          transformedUnits: [],
        },
      })
    })
    it('returns nothing if no transformedPairs', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const mardroemeUnit = TestUtil.getDbUnit({})
      const berserkerUnit = TestUtil.getDbUnit({})
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        getEffectWithKeyResponses: [
          TestUtil.getDbEffect({
            key: EffectKey.Mardroeme,
          }),
          TestUtil.getDbEffect({
            key: EffectKey.Berserker,
          }),
        ],
        getGameUnitsResponse: [
          TestUtil.getDbGameUnit({
            id: mardroemeUnit._id,
          }),
        ],
        getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
        replaceBerserkersWithVildkaarlResponse: [],
        expected: {
          impacts: {},
          mardroemingGameUnit: undefined,
          transformedGameUnits: [],
          transformedUnits: [],
        },
      })
    })
    it('returns single transformed unit if transformedPairs without impacts', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const mardroemeUnit = TestUtil.getDbUnit({})
      const berserkerUnit = TestUtil.getDbUnit({})
      const mardroemingGameUnit = TestUtil.getDbGameUnit({})
      const from = TestUtil.getDbGameUnit({})
      const unit = TestUtil.getDbUnit({})
      const to = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        getEffectWithKeyResponses: [
          TestUtil.getDbEffect({
            key: EffectKey.Mardroeme,
          }),
          TestUtil.getDbEffect({
            key: EffectKey.Berserker,
          }),
        ],
        getGameUnitsResponse: [
          TestUtil.getDbGameUnit({
            id: mardroemeUnit._id,
          }),
        ],
        getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
        getMardroemingGameUnitResponse: mardroemingGameUnit,
        replaceBerserkersWithVildkaarlResponse: [
          {
            from,
            to,
            unit,
          },
        ],
        expected: {
          impacts: {},
          mardroemingGameUnit,
          transformedGameUnits: [to],
          transformedUnits: [unit],
        },
        debugCalls: [[`${logPrefix} transformed "${JSON.stringify([unit._id])}" berserkers into vildkaarls`]],
      })
    })
    it('returns multiple transformed units if transformedPairs without impacts', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const mardroemeUnit = TestUtil.getDbUnit({})
      const berserkerUnit = TestUtil.getDbUnit({})
      const mardroemingGameUnit = TestUtil.getDbGameUnit({})
      const from1 = TestUtil.getDbGameUnit({})
      const unit1 = TestUtil.getDbUnit({})
      const to1 = TestUtil.getDbGameUnit({
        id: unit1._id,
      })
      const from2 = TestUtil.getDbGameUnit({})
      const unit2 = TestUtil.getDbUnit({})
      const to2 = TestUtil.getDbGameUnit({
        id: unit2._id,
      })
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        getEffectWithKeyResponses: [
          TestUtil.getDbEffect({
            key: EffectKey.Mardroeme,
          }),
          TestUtil.getDbEffect({
            key: EffectKey.Berserker,
          }),
        ],
        getGameUnitsResponse: [
          TestUtil.getDbGameUnit({
            id: mardroemeUnit._id,
          }),
        ],
        getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
        getMardroemingGameUnitResponse: mardroemingGameUnit,
        replaceBerserkersWithVildkaarlResponse: [
          {
            from: from1,
            to: to1,
            unit: unit1,
          },
          {
            from: from2,
            to: to2,
            unit: unit2,
          },
        ],
        expected: {
          impacts: {},
          mardroemingGameUnit,
          transformedGameUnits: [to1, to2],
          transformedUnits: [unit1, unit2],
        },
        debugCalls: [
          [`${logPrefix} transformed "${JSON.stringify([unit1._id, unit2._id])}" berserkers into vildkaarls`],
        ],
      })
    })
    it('returns single transformed unit if transformedPairs with impacts', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const mardroemeUnit = TestUtil.getDbUnit({
        id: newDeckUnit.unit,
      })
      const berserkerUnit = TestUtil.getDbUnit({})
      const mardroemingGameUnit = TestUtil.getDbGameUnit({})
      const from = TestUtil.getDbGameUnit({})
      const unit = TestUtil.getDbUnit({})
      const to = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        getEffectWithKeyResponses: [
          TestUtil.getDbEffect({
            key: EffectKey.Mardroeme,
          }),
          TestUtil.getDbEffect({
            key: EffectKey.Berserker,
          }),
        ],
        getGameUnitsResponse: [
          TestUtil.getDbGameUnit({
            id: mardroemeUnit._id,
          }),
        ],
        getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
        getMardroemingGameUnitResponse: mardroemingGameUnit,
        replaceBerserkersWithVildkaarlResponse: [
          {
            from,
            to,
            unit,
          },
        ],
        expected: {
          impacts: {
            [newDeckUnit.unit.toString()]: [
              {
                unit: from,
                user: player.user,
              },
            ],
          },
          mardroemingGameUnit,
          transformedGameUnits: [to],
          transformedUnits: [unit],
        },
        debugCalls: [[`${logPrefix} transformed "${JSON.stringify([unit._id])}" berserkers into vildkaarls`]],
      })
    })
    it('returns multiple transformed units if transformedPairs with impacts', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const mardroemeUnit = TestUtil.getDbUnit({
        id: newDeckUnit.unit,
      })
      const berserkerUnit = TestUtil.getDbUnit({})
      const mardroemingGameUnit = TestUtil.getDbGameUnit({})
      const from1 = TestUtil.getDbGameUnit({})
      const unit1 = TestUtil.getDbUnit({})
      const to1 = TestUtil.getDbGameUnit({
        id: unit1._id,
      })
      const from2 = TestUtil.getDbGameUnit({})
      const unit2 = TestUtil.getDbUnit({})
      const to2 = TestUtil.getDbGameUnit({
        id: unit2._id,
      })
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        getEffectWithKeyResponses: [
          TestUtil.getDbEffect({
            key: EffectKey.Mardroeme,
          }),
          TestUtil.getDbEffect({
            key: EffectKey.Berserker,
          }),
        ],
        getGameUnitsResponse: [
          TestUtil.getDbGameUnit({
            id: mardroemeUnit._id,
          }),
        ],
        getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
        getMardroemingGameUnitResponse: mardroemingGameUnit,
        replaceBerserkersWithVildkaarlResponse: [
          {
            from: from1,
            to: to1,
            unit: unit1,
          },
          {
            from: from2,
            to: to2,
            unit: unit2,
          },
        ],
        expected: {
          impacts: {
            [newDeckUnit.unit.toString()]: [
              {
                unit: from1,
                user: player.user,
              },
              {
                unit: from2,
                user: player.user,
              },
            ],
          },
          mardroemingGameUnit,
          transformedGameUnits: [to1, to2],
          transformedUnits: [unit1, unit2],
        },
        debugCalls: [
          [`${logPrefix} transformed "${JSON.stringify([unit1._id, unit2._id])}" berserkers into vildkaarls`],
        ],
      })
    })
    it('logs to trace if enabled', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const mardroemeUnit = TestUtil.getDbUnit({})
      const berserkerUnit = TestUtil.getDbUnit({})
      const mardroemingGameUnit = TestUtil.getDbGameUnit({})
      const from = TestUtil.getDbGameUnit({})
      const unit = TestUtil.getDbUnit({})
      const to = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        getEffectWithKeyResponses: [
          TestUtil.getDbEffect({
            key: EffectKey.Mardroeme,
          }),
          TestUtil.getDbEffect({
            key: EffectKey.Berserker,
          }),
        ],
        getGameUnitsResponse: [
          TestUtil.getDbGameUnit({
            id: mardroemeUnit._id,
          }),
        ],
        getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
        getMardroemingGameUnitResponse: mardroemingGameUnit,
        replaceBerserkersWithVildkaarlResponse: [
          {
            from,
            to,
            unit,
          },
        ],
        expected: {
          impacts: {},
          mardroemingGameUnit,
          transformedGameUnits: [to],
          transformedUnits: [unit],
        },
        debugCalls: [[`${logPrefix} transformed "${JSON.stringify([unit._id])}" berserkers into vildkaarls`]],
        traceEnabled: true,
      })
    })
  })
})

async function testTransformBerserkers({
  battlefieldUnits = [],
  combat,
  effects = [],
  game,
  logPrefix,
  newDeckUnit,
  getEffectWithKeyResponses,
  getUnitsWithEffectResponses,
  getGameUnitsResponse,
  getMardroemingGameUnitResponse,
  replaceBerserkersWithVildkaarlResponse,
  expected,
  errorCalls = [],
  debugCalls = [],
  traceEnabled,
}: {
  battlefieldUnits?: UnitDbObject[]
  combat?: Combat | null
  effects?: EffectDbObject[]
  game: GameDbObject
  logPrefix: string
  newDeckUnit: DeckUnitDbObject
  getEffectWithKeyResponses?: (EffectDbObject | undefined)[]
  getUnitsWithEffectResponses?: UnitDbObject[][]
  getGameUnitsResponse?: GameUnitDbObject[]
  getMardroemingGameUnitResponse?: GameUnitDbObject
  replaceBerserkersWithVildkaarlResponse?: TransformPairs[]
  expected: Transformations
  traceEnabled?: boolean
  errorCalls?: string[][]
  debugCalls?: string[][]
}) {
  const existingVildkaarlIds = [new ObjectId().toString()]
  const vildkaarls = [TestUtil.getDbUnit({})]
  const getEffectWithKeySpy = jest.spyOn(GetEffectWithKey, 'getEffectWithKey')
  if (getEffectWithKeyResponses) {
    for (const getEffectWithKeyResponse of getEffectWithKeyResponses) {
      getEffectWithKeySpy.mockReturnValueOnce(getEffectWithKeyResponse)
    }
  }
  const getGameUnitsSpy = jest.spyOn(getGameUnits, 'default')
  if (getGameUnitsResponse) {
    getGameUnitsSpy.mockReturnValue(getGameUnitsResponse)
  }
  const getUnitsWithEffectSpy = jest.spyOn(EffectMardroeme as any, 'getUnitsWithEffect')
  if (getUnitsWithEffectResponses) {
    for (const getUnitsWithEffectResponse of getUnitsWithEffectResponses) {
      getUnitsWithEffectSpy.mockReturnValueOnce(getUnitsWithEffectResponse)
    }
  }
  const getMardroemingGameUnitSpy = jest
    .spyOn(EffectMardroeme as any, 'getMardroemingGameUnit')
    .mockReturnValue(getMardroemingGameUnitResponse)
  const getExistingVildkaarlIdsSpy = jest
    .spyOn(EffectMardroeme as any, 'getExistingVildkaarlIds')
    .mockReturnValue(existingVildkaarlIds)
  const getVildkaarlsForTransformationSpy = jest
    .spyOn(EffectMardroeme as any, 'getVildkaarlsForTransformation')
    .mockResolvedValue(vildkaarls)
  const replaceBerserkersWithVildkaarlSpy = jest.spyOn(EffectMardroeme as any, 'replaceBerserkersWithVildkaarl')
  if (replaceBerserkersWithVildkaarlResponse) {
    replaceBerserkersWithVildkaarlSpy.mockReturnValue(replaceBerserkersWithVildkaarlResponse)
  }
  const errorSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  EffectMardroeme['logger'] = {
    error: errorSpy,
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(
    EffectMardroeme.transformBerserkers({
      battlefieldUnits,
      effects,
      game,
      logPrefix,
      newDeckUnit,
      combat,
    })
  ).resolves.toEqual(expected)

  expect(getEffectWithKeySpy.mock.calls).toEqual([
    [
      {
        effectKey: EffectKey.Mardroeme,
        effects,
        logPrefix,
      },
    ],
    [
      {
        effectKey: EffectKey.Berserker,
        effects,
        logPrefix,
      },
    ],
  ])
  expect(getGameUnitsSpy.mock.calls).toEqual(
    getGameUnitsResponse
      ? [
          [
            {
              combat,
              players: game.players.filter((player) => player.user.toString() === game.turn?.toString()),
              round: game.round,
            },
          ],
        ]
      : []
  )
  expect(getUnitsWithEffectSpy.mock.calls).toEqual(
    getUnitsWithEffectResponses
      ? [
          [
            {
              gameUnits: getGameUnitsResponse,
              battlefieldUnits,
              effect: getEffectWithKeyResponses ? getEffectWithKeyResponses[0] : undefined,
            },
          ],
          [
            {
              gameUnits: getGameUnitsResponse,
              battlefieldUnits,
              effect: getEffectWithKeyResponses ? getEffectWithKeyResponses[1] : undefined,
            },
          ],
        ]
      : []
  )
  expect(getMardroemingGameUnitSpy.mock.calls).toEqual(
    replaceBerserkersWithVildkaarlResponse
      ? [
          [
            {
              gameUnits: getGameUnitsResponse,
              mardroemes: getUnitsWithEffectResponses ? getUnitsWithEffectResponses[0] : undefined,
            },
          ],
        ]
      : []
  )
  expect(getExistingVildkaarlIdsSpy.mock.calls).toEqual(
    replaceBerserkersWithVildkaarlResponse
      ? [
          [
            {
              battlefieldUnits,
              gameUnits: getGameUnitsResponse,
            },
          ],
        ]
      : []
  )
  expect(getVildkaarlsForTransformationSpy.mock.calls).toEqual(
    replaceBerserkersWithVildkaarlResponse
      ? [
          [
            {
              berserkers: getUnitsWithEffectResponses ? getUnitsWithEffectResponses[1] : undefined,
              existingVildkaarlIds,
              limit: getUnitsWithEffectResponses ? getUnitsWithEffectResponses[1].length : undefined,
            },
          ],
        ]
      : []
  )
  const round = game.players.find((player) => player.user.toString() === game.turn?.toString())?.rounds[game.round - 1]
  expect(replaceBerserkersWithVildkaarlSpy.mock.calls).toEqual(
    replaceBerserkersWithVildkaarlResponse
      ? [
          [
            {
              berserkers: getUnitsWithEffectResponses ? getUnitsWithEffectResponses[1] : undefined,
              row: combat === Combat.Close ? round?.close : combat === Combat.Ranged ? round?.ranged : round?.siege,
              vildkaarls,
            },
          ],
        ]
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `${logPrefix} mardroemeEffect: "${JSON.stringify(getEffectWithKeyResponses && getEffectWithKeyResponses[0])}"`,
          ],
          [
            `${logPrefix} berserkerEffect: "${JSON.stringify(getEffectWithKeyResponses && getEffectWithKeyResponses[1])}"`,
          ],
          [`${logPrefix} gameUnits: "${JSON.stringify(getGameUnitsResponse)}"`],
          [
            `${logPrefix} mardroemes: "${JSON.stringify(getUnitsWithEffectResponses && getUnitsWithEffectResponses[0])}"`,
          ],
          [
            `${logPrefix} berserkers: "${JSON.stringify(getUnitsWithEffectResponses && getUnitsWithEffectResponses[1])}"`,
          ],
        ]
      : []
  )
}
