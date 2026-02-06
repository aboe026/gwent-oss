import { ObjectId } from 'mongodb'

import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  GameUnitDbObject,
  GameUnitEffectDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import { EFFECT_OPERATOR } from '@gwent/constants'
import { EffectReasonType } from '@gwent/graphql-schema'
import EffectWeather, { WeatheredBattlefield } from '../../src/graphql/resolvers/mutations/play-unit/effect-weather'
import GetEffectWithKey from '../../src/graphql/resolvers/mutations/play-unit/get-effect-with-key'
import { ImpactsByUnitId } from '../../src/graphql/resolvers/resolver-util'
import { PlayerWeatherUnit } from '../../src/graphql/resolvers/mutations/play-unit/get-weather-units-for-row'
import TestUtil from '../util/test-util'

describe('effect-weather', () => {
  describe('weatherBattlefield', () => {
    const logPrefix = 'log-prefix'
    it('does not impact if not weather', () => {
      const userId = new ObjectId()
      const newUnit = TestUtil.getDbUnit({})
      testWeatherBattlefield({
        logPrefix,
        game: TestUtil.getDbGame({
          turn: userId,
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [TestUtil.getDbPlayerRound({})],
            }),
          ],
        }),
        newUnit,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: newUnit._id,
        }),
        expected: {
          newUnitHasWeather: false,
          impacts: {},
        },
      })
    })
    it('does not impact if weather with combats', () => {
      const userId = new ObjectId()
      const weatherEffect = TestUtil.getDbEffect({})
      const newUnit = TestUtil.getDbUnit({
        effects: [weatherEffect._id],
        combats: [Combat.Close],
      })
      testWeatherBattlefield({
        logPrefix,
        game: TestUtil.getDbGame({
          turn: userId,
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [TestUtil.getDbPlayerRound({})],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [TestUtil.getDbPlayerRound({})],
            }),
          ],
        }),
        newUnit,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: newUnit._id,
        }),
        weatherEffect,
        expected: {
          newUnitHasWeather: true,
          impacts: {},
        },
        debugCalls: [[`${logPrefix} adding weather "${newUnit._id}"`]],
      })
    })
    it('does not impact if weather with no combats but no existing weathers', () => {
      const userId = new ObjectId()
      const weatherEffect = TestUtil.getDbEffect({})
      const newUnit = TestUtil.getDbUnit({
        effects: [weatherEffect._id],
      })
      const opponentId = new ObjectId()
      testWeatherBattlefield({
        logPrefix,
        game: TestUtil.getDbGame({
          turn: userId,
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [TestUtil.getDbPlayerRound({})],
            }),
            TestUtil.getDbGamePlayer({
              user: opponentId,
              rounds: [TestUtil.getDbPlayerRound({})],
            }),
          ],
        }),
        newUnit,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: newUnit._id,
        }),
        weatherEffect,
        expected: {
          newUnitHasWeather: true,
          impacts: {},
        },
        debugCalls: [
          [`${logPrefix} weather "${newUnit._id}" has no combats so clearing weathers for player "${userId}"`],
          [`${logPrefix} weather "${newUnit._id}" has no combats so clearing weathers for player "${opponentId}"`],
        ],
      })
    })
    it('impacts if weather with no combats and existing single weather self', () => {
      const userId = new ObjectId()
      const weatherEffect = TestUtil.getDbEffect({})
      const newUnit = TestUtil.getDbUnit({
        effects: [weatherEffect._id],
      })
      const existingWeathers = [TestUtil.getDbGameUnit({})]
      const opponentId = new ObjectId()
      testWeatherBattlefield({
        logPrefix,
        game: TestUtil.getDbGame({
          turn: userId,
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  weathers: [existingWeathers[0]],
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              user: opponentId,
              rounds: [TestUtil.getDbPlayerRound({})],
            }),
          ],
        }),
        newUnit,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: newUnit._id,
        }),
        weatherEffect,
        expected: {
          newUnitHasWeather: true,
          impacts: {
            [newUnit._id.toString()]: [
              {
                unit: existingWeathers[0],
                user: userId,
              },
            ],
          },
        },
        debugCalls: [
          [`${logPrefix} weather "${newUnit._id}" has no combats so clearing weathers for player "${userId}"`],
          [`${logPrefix} weather "${newUnit._id}" has no combats so clearing weathers for player "${opponentId}"`],
        ],
      })
    })
    it('impacts if weather with no combats and existing single weather opponent', () => {
      const userId = new ObjectId()
      const weatherEffect = TestUtil.getDbEffect({})
      const newUnit = TestUtil.getDbUnit({
        effects: [weatherEffect._id],
      })
      const existingWeathers = [TestUtil.getDbGameUnit({})]
      const opponentId = new ObjectId()
      testWeatherBattlefield({
        logPrefix,
        game: TestUtil.getDbGame({
          turn: userId,
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [TestUtil.getDbPlayerRound({})],
            }),
            TestUtil.getDbGamePlayer({
              user: opponentId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  weathers: [existingWeathers[0]],
                }),
              ],
            }),
          ],
        }),
        newUnit,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: newUnit._id,
        }),
        weatherEffect,
        expected: {
          newUnitHasWeather: true,
          impacts: {
            [newUnit._id.toString()]: [
              {
                unit: existingWeathers[0],
                user: opponentId,
              },
            ],
          },
        },
        debugCalls: [
          [`${logPrefix} weather "${newUnit._id}" has no combats so clearing weathers for player "${userId}"`],
          [`${logPrefix} weather "${newUnit._id}" has no combats so clearing weathers for player "${opponentId}"`],
        ],
      })
    })
    it('impacts if weather with no combats and existing single weather both', () => {
      const userId = new ObjectId()
      const weatherEffect = TestUtil.getDbEffect({})
      const newUnit = TestUtil.getDbUnit({
        effects: [weatherEffect._id],
      })
      const existingWeathers = [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})]
      const opponentId = new ObjectId()
      testWeatherBattlefield({
        logPrefix,
        game: TestUtil.getDbGame({
          turn: userId,
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  weathers: [existingWeathers[0]],
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              user: opponentId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  weathers: [existingWeathers[1]],
                }),
              ],
            }),
          ],
        }),
        newUnit,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: newUnit._id,
        }),
        weatherEffect,
        expected: {
          newUnitHasWeather: true,
          impacts: {
            [newUnit._id.toString()]: [
              {
                unit: existingWeathers[0],
                user: userId,
              },
              {
                unit: existingWeathers[1],
                user: opponentId,
              },
            ],
          },
        },
        debugCalls: [
          [`${logPrefix} weather "${newUnit._id}" has no combats so clearing weathers for player "${userId}"`],
          [`${logPrefix} weather "${newUnit._id}" has no combats so clearing weathers for player "${opponentId}"`],
        ],
      })
    })
    it('impacts if weather with no combats and existing multiple weathers self', () => {
      const userId = new ObjectId()
      const weatherEffect = TestUtil.getDbEffect({})
      const newUnit = TestUtil.getDbUnit({
        effects: [weatherEffect._id],
      })
      const existingWeathers = [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})]
      const opponentId = new ObjectId()
      testWeatherBattlefield({
        logPrefix,
        game: TestUtil.getDbGame({
          turn: userId,
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  weathers: [existingWeathers[0], existingWeathers[1]],
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              user: opponentId,
              rounds: [TestUtil.getDbPlayerRound({})],
            }),
          ],
        }),
        newUnit,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: newUnit._id,
        }),
        weatherEffect,
        expected: {
          newUnitHasWeather: true,
          impacts: {
            [newUnit._id.toString()]: [
              {
                unit: existingWeathers[0],
                user: userId,
              },
              {
                unit: existingWeathers[1],
                user: userId,
              },
            ],
          },
        },
        debugCalls: [
          [`${logPrefix} weather "${newUnit._id}" has no combats so clearing weathers for player "${userId}"`],
          [`${logPrefix} weather "${newUnit._id}" has no combats so clearing weathers for player "${opponentId}"`],
        ],
      })
    })
    it('impacts if weather with no combats and existing multiple weathers opponent', () => {
      const userId = new ObjectId()
      const weatherEffect = TestUtil.getDbEffect({})
      const newUnit = TestUtil.getDbUnit({
        effects: [weatherEffect._id],
      })
      const existingWeathers = [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})]
      const opponentId = new ObjectId()
      testWeatherBattlefield({
        logPrefix,
        game: TestUtil.getDbGame({
          turn: userId,
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [TestUtil.getDbPlayerRound({})],
            }),
            TestUtil.getDbGamePlayer({
              user: opponentId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  weathers: [existingWeathers[0], existingWeathers[1]],
                }),
              ],
            }),
          ],
        }),
        newUnit,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: newUnit._id,
        }),
        weatherEffect,
        expected: {
          newUnitHasWeather: true,
          impacts: {
            [newUnit._id.toString()]: [
              {
                unit: existingWeathers[0],
                user: opponentId,
              },
              {
                unit: existingWeathers[1],
                user: opponentId,
              },
            ],
          },
        },
        debugCalls: [
          [`${logPrefix} weather "${newUnit._id}" has no combats so clearing weathers for player "${userId}"`],
          [`${logPrefix} weather "${newUnit._id}" has no combats so clearing weathers for player "${opponentId}"`],
        ],
      })
    })
    it('impacts if weather with no combats and existing multiple weathers both', () => {
      const userId = new ObjectId()
      const weatherEffect = TestUtil.getDbEffect({})
      const newUnit = TestUtil.getDbUnit({
        effects: [weatherEffect._id],
      })
      const existingWeathers = [
        TestUtil.getDbGameUnit({}),
        TestUtil.getDbGameUnit({}),
        TestUtil.getDbGameUnit({}),
        TestUtil.getDbGameUnit({}),
      ]
      const opponentId = new ObjectId()
      testWeatherBattlefield({
        logPrefix,
        game: TestUtil.getDbGame({
          turn: userId,
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  weathers: [existingWeathers[0], existingWeathers[1]],
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              user: opponentId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  weathers: [existingWeathers[2], existingWeathers[3]],
                }),
              ],
            }),
          ],
        }),
        newUnit,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: newUnit._id,
        }),
        weatherEffect,
        expected: {
          newUnitHasWeather: true,
          impacts: {
            [newUnit._id.toString()]: [
              {
                unit: existingWeathers[0],
                user: userId,
              },
              {
                unit: existingWeathers[1],
                user: userId,
              },
              {
                unit: existingWeathers[2],
                user: opponentId,
              },
              {
                unit: existingWeathers[3],
                user: opponentId,
              },
            ],
          },
        },
        debugCalls: [
          [`${logPrefix} weather "${newUnit._id}" has no combats so clearing weathers for player "${userId}"`],
          [`${logPrefix} weather "${newUnit._id}" has no combats so clearing weathers for player "${opponentId}"`],
        ],
      })
    })
    it('logs to trace if enabled', () => {
      const userId = new ObjectId()
      const weatherEffect = TestUtil.getDbEffect({})
      const newUnit = TestUtil.getDbUnit({
        effects: [weatherEffect._id],
        combats: [Combat.Close],
      })
      testWeatherBattlefield({
        logPrefix,
        game: TestUtil.getDbGame({
          turn: userId,
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [TestUtil.getDbPlayerRound({})],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [TestUtil.getDbPlayerRound({})],
            }),
          ],
        }),
        newUnit,
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: newUnit._id,
        }),
        weatherEffect,
        expected: {
          newUnitHasWeather: true,
          impacts: {},
        },
        debugCalls: [[`${logPrefix} adding weather "${newUnit._id}"`]],
        traceEnabled: true,
        traceCalls: [
          [`${logPrefix} weatherEffect: "${JSON.stringify(weatherEffect)}"`],
          [`${logPrefix} newUnitHasWeather: "true"`],
        ],
      })
    })
  })
  describe('weatherScores', () => {
    const logPrefix = 'log-prefix'
    it('hero not affected', () => {
      const currentPlayerId = new ObjectId()
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const rowUnit = TestUtil.getDbUnit({
        strength: 2,
        hero: true,
      })
      const rowGameUnit = TestUtil.getDbGameUnit({
        id: rowUnit._id,
      })
      const weatherEffect = TestUtil.getDbEffect({})
      testWeatherScores({
        logPrefix,
        currentPlayerId,
        newDeckUnit,
        rowGameUnit,
        rowUnit,
        userId: currentPlayerId,
        weatherEffect,
        weatherUnits: [
          {
            userId: currentPlayerId,
            unit: TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          },
        ],
        expected: {},
        newEffects: [],
        debugCalls: [[`${logPrefix} rowUnit "${rowUnit._id}" is hero so not susceptible to weather effect.`]],
      })
    })
    it('does not add impact if no weatherEffect', () => {
      const currentPlayerId = new ObjectId()
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const rowUnit = TestUtil.getDbUnit({
        strength: 2,
      })
      const rowGameUnit = TestUtil.getDbGameUnit({
        id: rowUnit._id,
      })
      testWeatherScores({
        logPrefix,
        currentPlayerId,
        newDeckUnit,
        rowGameUnit,
        rowUnit,
        userId: currentPlayerId,
        weatherEffect: undefined,
        weatherUnits: [
          {
            userId: currentPlayerId,
            unit: TestUtil.getDbUnit({
              id: new ObjectId(),
            }),
          },
        ],
        expected: {},
        newEffects: [],
      })
    })
    it('does not add impact if weather is current player and not newDeckUnit', () => {
      const currentPlayerId = new ObjectId()
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const rowUnit = TestUtil.getDbUnit({
        strength: 2,
      })
      const rowGameUnit = TestUtil.getDbGameUnit({
        id: rowUnit._id,
      })
      const weatherEffect = TestUtil.getDbEffect({})
      const weatherUnitId = new ObjectId()
      testWeatherScores({
        logPrefix,
        currentPlayerId,
        newDeckUnit,
        rowGameUnit,
        rowUnit,
        userId: currentPlayerId,
        weatherEffect,
        weatherUnits: [
          {
            userId: currentPlayerId,
            unit: TestUtil.getDbUnit({
              id: weatherUnitId,
            }),
          },
        ],
        expected: {},
        newEffects: [
          {
            operator: EFFECT_OPERATOR.Set,
            reason: {
              effect: weatherEffect._id,
              type: EffectReasonType.Unit,
              unit: weatherUnitId,
            },
            total: 1,
          },
        ],
        debugCalls: [
          [`${logPrefix} weathering unit "${rowUnit._id}" by "${weatherUnitId}" for an effectiveStrength of "1".`],
        ],
      })
    })
    it('does not add impact if weather is not current player and newDeckUnit', () => {
      const currentPlayerId = new ObjectId()
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const rowUnit = TestUtil.getDbUnit({
        strength: 2,
      })
      const rowGameUnit = TestUtil.getDbGameUnit({
        id: rowUnit._id,
      })
      const weatherEffect = TestUtil.getDbEffect({})
      testWeatherScores({
        logPrefix,
        currentPlayerId,
        newDeckUnit,
        rowGameUnit,
        rowUnit,
        userId: currentPlayerId,
        weatherEffect,
        weatherUnits: [
          {
            userId: new ObjectId(),
            unit: TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          },
        ],
        expected: {},
        newEffects: [
          {
            operator: EFFECT_OPERATOR.Set,
            reason: {
              effect: weatherEffect._id,
              type: EffectReasonType.Unit,
              unit: newDeckUnit.unit,
            },
            total: 1,
          },
        ],
        debugCalls: [
          [`${logPrefix} weathering unit "${rowUnit._id}" by "${newDeckUnit.unit}" for an effectiveStrength of "1".`],
        ],
      })
    })
    it('adds impact if weather is current player and newDeckUnit', () => {
      const currentPlayerId = new ObjectId()
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const rowUnit = TestUtil.getDbUnit({
        strength: 3,
      })
      const rowGameUnit = TestUtil.getDbGameUnit({
        id: rowUnit._id,
      })
      const weatherEffect = TestUtil.getDbEffect({})
      testWeatherScores({
        logPrefix,
        currentPlayerId,
        newDeckUnit,
        rowGameUnit,
        rowUnit,
        userId: currentPlayerId,
        weatherEffect,
        weatherUnits: [
          {
            userId: currentPlayerId,
            unit: TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          },
          {
            userId: currentPlayerId,
            unit: TestUtil.getDbUnit({
              id: new ObjectId(),
            }),
          },
        ],
        expected: {
          [newDeckUnit.unit.toString()]: [
            {
              unit: rowGameUnit,
              user: currentPlayerId,
            },
          ],
        },
        newEffects: [
          {
            operator: EFFECT_OPERATOR.Set,
            reason: {
              effect: weatherEffect._id,
              type: EffectReasonType.Unit,
              unit: newDeckUnit.unit,
            },
            total: 1,
          },
        ],
        debugCalls: [
          [`${logPrefix} weathering unit "${rowUnit._id}" by "${newDeckUnit.unit}" for an effectiveStrength of "1".`],
        ],
      })
    })
    it('does not add impact if weather is current player and newDeckUnit with strength 0', () => {
      const currentPlayerId = new ObjectId()
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const rowUnit = TestUtil.getDbUnit({
        strength: 0,
      })
      const rowGameUnit = TestUtil.getDbGameUnit({
        id: rowUnit._id,
      })
      const weatherEffect = TestUtil.getDbEffect({})
      testWeatherScores({
        logPrefix,
        currentPlayerId,
        newDeckUnit,
        rowGameUnit,
        rowUnit,
        userId: currentPlayerId,
        weatherEffect,
        weatherUnits: [
          {
            userId: currentPlayerId,
            unit: TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          },
        ],
        expected: {},
        debugCalls: [
          [
            `${logPrefix} rowUnit "${rowUnit._id}" strength "${rowUnit.strength}" is less than "2" so not susceptible to weather effect.`,
          ],
        ],
      })
    })
    it('does not add impact if weathered by opponents first', () => {
      const currentPlayerId = new ObjectId()
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const rowUnit = TestUtil.getDbUnit({
        strength: 3,
      })
      const rowGameUnit = TestUtil.getDbGameUnit({
        id: rowUnit._id,
      })
      const weatherEffect = TestUtil.getDbEffect({})
      const opponentId = new ObjectId()
      testWeatherScores({
        logPrefix,
        currentPlayerId,
        newDeckUnit,
        rowGameUnit,
        rowUnit,
        userId: currentPlayerId,
        weatherEffect,
        weatherUnits: [
          {
            userId: currentPlayerId,
            unit: TestUtil.getDbUnit({
              id: new ObjectId(),
            }),
          },
          {
            userId: opponentId,
            unit: TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          },
        ],
        expected: {},
        newEffects: [
          {
            operator: EFFECT_OPERATOR.Set,
            reason: {
              effect: weatherEffect._id,
              type: EffectReasonType.Unit,
              unit: newDeckUnit.unit,
            },
            total: 1,
          },
        ],
        debugCalls: [
          [`${logPrefix} weathering unit "${rowUnit._id}" by "${newDeckUnit.unit}" for an effectiveStrength of "1".`],
        ],
      })
    })
    it('does not add impact if weathered by opponents only', () => {
      const currentPlayerId = new ObjectId()
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const rowUnit = TestUtil.getDbUnit({
        strength: 3,
      })
      const rowGameUnit = TestUtil.getDbGameUnit({
        id: rowUnit._id,
      })
      const weatherEffect = TestUtil.getDbEffect({})
      const opponentId = new ObjectId()
      testWeatherScores({
        logPrefix,
        currentPlayerId,
        newDeckUnit,
        rowGameUnit,
        rowUnit,
        userId: currentPlayerId,
        weatherEffect,
        weatherUnits: [
          {
            userId: opponentId,
            unit: TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          },
          {
            userId: opponentId,
            unit: TestUtil.getDbUnit({
              id: new ObjectId(),
            }),
          },
        ],
        expected: {},
        newEffects: [
          {
            operator: EFFECT_OPERATOR.Set,
            reason: {
              effect: weatherEffect._id,
              type: EffectReasonType.Unit,
              unit: newDeckUnit.unit,
            },
            total: 1,
          },
        ],
        debugCalls: [
          [`${logPrefix} weathering unit "${rowUnit._id}" by "${newDeckUnit.unit}" for an effectiveStrength of "1".`],
        ],
      })
    })
    it('logs to trace if enabled', () => {
      const currentPlayerId = new ObjectId()
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const rowUnit = TestUtil.getDbUnit({
        strength: 3,
      })
      const rowGameUnit = TestUtil.getDbGameUnit({
        id: rowUnit._id,
      })
      const weatherEffect = TestUtil.getDbEffect({})
      const weathersToApply = [
        {
          userId: currentPlayerId,
          unit: TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        },
      ]
      const gameUnitEffect = {
        operator: EFFECT_OPERATOR.Set,
        reason: {
          effect: weatherEffect._id,
          type: EffectReasonType.Unit,
          unit: newDeckUnit.unit,
        },
        total: 1,
      }
      testWeatherScores({
        logPrefix,
        currentPlayerId,
        newDeckUnit,
        rowGameUnit,
        rowUnit,
        userId: currentPlayerId,
        weatherEffect,
        weatherUnits: weathersToApply,
        expected: {
          [newDeckUnit.unit.toString()]: [
            {
              unit: rowGameUnit,
              user: currentPlayerId,
            },
          ],
        },
        newEffects: [gameUnitEffect],
        debugCalls: [
          [`${logPrefix} weathering unit "${rowUnit._id}" by "${newDeckUnit.unit}" for an effectiveStrength of "1".`],
        ],
        traceEnabled: true,
        traceCalls: [
          [`${logPrefix} rowUnit: "${JSON.stringify(rowUnit)}"`],
          [`${logPrefix} weathersToApply: "${JSON.stringify(weathersToApply)}"`],
          [`${logPrefix} gameUnitEffect: "${JSON.stringify(gameUnitEffect)}"`],
          [
            `${logPrefix} impact: "${JSON.stringify({
              unit: {
                ...rowGameUnit,
                effects: [gameUnitEffect],
                effectiveStrength: 1,
              },
              user: currentPlayerId,
            })}"`,
          ],
        ],
      })
    })
  })
})

function testWeatherBattlefield({
  game,
  logPrefix,
  newDeckUnit,
  newUnit,
  weatherEffect,
  expected,
  traceEnabled,
  debugCalls = [],
  traceCalls = [],
}: {
  game: GameDbObject
  logPrefix: string
  newDeckUnit: DeckUnitDbObject
  newUnit: UnitDbObject
  weatherEffect?: EffectDbObject
  expected: WeatheredBattlefield
  traceEnabled?: boolean
  debugCalls?: string[][]
  traceCalls?: string[][]
}) {
  const effects = [TestUtil.getDbEffect({})]
  const getEffectWithKeySpy = jest.spyOn(GetEffectWithKey, 'getEffectWithKey')
  if (weatherEffect) {
    getEffectWithKeySpy.mockReturnValue(weatherEffect)
  }
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  EffectWeather['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  expect(
    EffectWeather.weatherBattlefield({
      effects,
      game,
      logPrefix,
      newDeckUnit,
      newUnit,
    })
  ).toEqual(expected)

  expect(getEffectWithKeySpy.mock.calls).toEqual([
    [
      {
        effectKey: EffectKey.Weather,
        effects,
        logPrefix,
      },
    ],
  ])
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}

function testWeatherScores({
  logPrefix,
  weatherUnits,
  weatherEffect,
  newDeckUnit,
  rowGameUnit,
  rowUnit,
  userId,
  currentPlayerId,
  expected,
  newEffects = [],
  traceEnabled,
  debugCalls = [],
  traceCalls = [],
}: {
  logPrefix: string
  weatherUnits: PlayerWeatherUnit[]
  weatherEffect: EffectDbObject | undefined
  newDeckUnit: DeckUnitDbObject
  rowGameUnit: GameUnitDbObject
  rowUnit: UnitDbObject
  userId: ObjectId
  currentPlayerId: ObjectId | undefined
  expected: ImpactsByUnitId
  newEffects?: GameUnitEffectDbObject[]
  traceEnabled?: boolean
  debugCalls?: string[][]
  traceCalls?: string[][]
}) {
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  EffectWeather['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  expect(
    EffectWeather.weatherScores({
      currentPlayerId,
      logPrefix,
      newDeckUnit,
      rowGameUnit,
      rowUnit,
      userId,
      weatherEffect,
      weatherUnits,
    })
  ).toEqual(expected)

  expect(rowGameUnit.effects).toEqual(newEffects)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
