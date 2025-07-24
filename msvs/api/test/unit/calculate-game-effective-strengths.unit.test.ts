import { ObjectId } from 'mongodb'

import CalculateGameEffectiveStrengths from '../../src/graphql/resolvers/mutations/play-unit/calculate-game-effective-strengths'
import deepClone from '../util/deep-clone'
import {
  EffectKey,
  ImpactDbObject,
  PlayerCombatRowDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import EffectMorale from '../../src/graphql/resolvers/mutations/play-unit/effect-morale'
import GetEffectWithKey from '../../src/graphql/resolvers/mutations/play-unit/get-effect-with-key'
import TestUtil from '../util/test-util'

describe('calculate-game-effective-strengths', () => {
  describe('calculateEffectiveStrengths', () => {
    it('returns undefined if no impacts on any row', () => {
      testCalculateEffectiveStrengths({
        rowResults: [[], [], [], [], [], []],
        expected: undefined,
      })
    })
    it('returns single impact', () => {
      const impact: ImpactDbObject = {
        unit: {
          artStyle: 1,
          unit: new ObjectId(),
        },
        user: new ObjectId(),
      }
      testCalculateEffectiveStrengths({
        rowResults: [[], [], [], [impact], [], []],
        expected: [impact],
      })
    })
    it('returns multiple impacts from single row result', () => {
      const impact1: ImpactDbObject = {
        unit: {
          artStyle: 1,
          unit: new ObjectId(),
        },
        user: new ObjectId(),
      }
      const impact2: ImpactDbObject = {
        unit: {
          artStyle: 2,
          unit: new ObjectId(),
        },
        user: new ObjectId(),
      }
      testCalculateEffectiveStrengths({
        rowResults: [[], [], [], [impact1, impact2], [], []],
        expected: [impact1, impact2],
      })
    })
    it('returns multiple impacts from multiple row results', () => {
      const impact1: ImpactDbObject = {
        unit: {
          artStyle: 1,
          unit: new ObjectId(),
        },
        user: new ObjectId(),
      }
      const impact2: ImpactDbObject = {
        unit: {
          artStyle: 2,
          unit: new ObjectId(),
        },
        user: new ObjectId(),
      }
      testCalculateEffectiveStrengths({
        rowResults: [[], [], [], [impact1], [impact2], []],
        expected: [impact1, impact2],
      })
    })
  })
  describe('calculateEffectiveStrengthsForRow', () => {
    it('throws error if matching unit not found', () => {
      const logPrefix = 'log-prefix'
      const rowUnit = TestUtil.getDbGameUnit({})
      const message = `Could not find Unit with ID "${rowUnit.unit}"`
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowUnit],
        },
        units: [],
        logPrefix,
        expected: Error(`${message}.`),
        modifiedRow: {
          score: 0,
          units: [deepClone(rowUnit)],
        },
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns empty array if no units', () => {
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [],
        },
        units: [],
        expected: [],
        modifiedRow: {
          score: 0,
          units: [],
        },
      })
    })
    it('does not set effectiveStrength for unit with undefined strength', () => {
      const rowUnit = TestUtil.getDbGameUnit({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowUnit],
        },
        units: [
          TestUtil.getDbUnit({
            id: rowUnit.unit,
          }),
        ],
        expected: [],

        modifiedRow: {
          score: 0,
          units: [deepClone(rowUnit)],
        },
      })
    })
    it('does not set effectiveStrength for unit with null strength', () => {
      const rowUnit = TestUtil.getDbGameUnit({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowUnit],
        },
        units: [
          TestUtil.getDbUnit({
            id: rowUnit.unit,
            strength: null as any,
          }),
        ],
        expected: [],
        modifiedRow: {
          score: 0,
          units: [deepClone(rowUnit)],
        },
      })
    })
    it('sets effectiveStrength for unit with strength zero', () => {
      const rowUnit = TestUtil.getDbGameUnit({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowUnit],
        },
        units: [
          TestUtil.getDbUnit({
            id: rowUnit.unit,
            strength: 0,
          }),
        ],
        expected: [],
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowUnit),
              effectiveStrength: 0,
              effects: [],
            },
          ],
        },
      })
    })
    it('sets effectiveStrength for unit with strength non zero', () => {
      const rowUnit = TestUtil.getDbGameUnit({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowUnit],
        },
        units: [
          TestUtil.getDbUnit({
            id: rowUnit.unit,
            strength: 1,
          }),
        ],
        expected: [],
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowUnit),
              effectiveStrength: 1,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds single impact from morale for single unit', () => {
      const rowUnit = TestUtil.getDbGameUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowUnit],
        },
        units: [
          TestUtil.getDbUnit({
            id: rowUnit.unit,
            strength: 1,
          }),
        ],
        applyMoralesResponses: [[impact]],
        expected: [impact],
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowUnit),
              effectiveStrength: 1,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds multiple impacts from morale for single unit', () => {
      const rowUnit = TestUtil.getDbGameUnit({})
      const impact1: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const impact2: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowUnit],
        },
        units: [
          TestUtil.getDbUnit({
            id: rowUnit.unit,
            strength: 1,
          }),
        ],
        applyMoralesResponses: [[impact1, impact2]],
        expected: [impact1, impact2],
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowUnit),
              effectiveStrength: 1,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds single impact from morale for one of many', () => {
      const rowUnit1 = TestUtil.getDbGameUnit({})
      const rowUnit2 = TestUtil.getDbGameUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowUnit1, rowUnit2],
        },
        units: [
          TestUtil.getDbUnit({
            id: rowUnit1.unit,
            strength: 1,
          }),
          TestUtil.getDbUnit({
            id: rowUnit2.unit,
            strength: 2,
          }),
        ],
        applyMoralesResponses: [[], [impact]],
        expected: [impact],
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowUnit1),
              effectiveStrength: 1,
              effects: [],
            },
            {
              ...deepClone(rowUnit2),
              effectiveStrength: 2,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds single impact from morale for each of many', () => {
      const rowUnit1 = TestUtil.getDbGameUnit({})
      const rowUnit2 = TestUtil.getDbGameUnit({})
      const impact1: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const impact2: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowUnit1, rowUnit2],
        },
        units: [
          TestUtil.getDbUnit({
            id: rowUnit1.unit,
            strength: 1,
          }),
          TestUtil.getDbUnit({
            id: rowUnit2.unit,
            strength: 2,
          }),
        ],
        applyMoralesResponses: [[impact1], [impact2]],
        expected: [impact1, impact2],
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowUnit1),
              effectiveStrength: 1,
              effects: [],
            },
            {
              ...deepClone(rowUnit2),
              effectiveStrength: 2,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds multiple impacts from morale for each of many', () => {
      const rowUnit1 = TestUtil.getDbGameUnit({})
      const rowUnit2 = TestUtil.getDbGameUnit({})
      const impact1: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const impact2: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const impact3: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const impact4: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowUnit1, rowUnit2],
        },
        units: [
          TestUtil.getDbUnit({
            id: rowUnit1.unit,
            strength: 1,
          }),
          TestUtil.getDbUnit({
            id: rowUnit2.unit,
            strength: 2,
          }),
        ],
        applyMoralesResponses: [
          [impact1, impact2],
          [impact3, impact4],
        ],
        expected: [impact1, impact2, impact3, impact4],
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowUnit1),
              effectiveStrength: 1,
              effects: [],
            },
            {
              ...deepClone(rowUnit2),
              effectiveStrength: 2,
              effects: [],
            },
          ],
        },
      })
    })
  })
})

function testCalculateEffectiveStrengths({
  rowResults,
  expected,
}: {
  rowResults: (ImpactDbObject[] | undefined)[]
  expected: ImpactDbObject[] | undefined
}) {
  const logPrefix = 'log-prefix'
  const moraleEffect = TestUtil.getDbEffect({})
  const getEffectWithKeySpy = jest.spyOn(GetEffectWithKey, 'getEffectWithKey').mockReturnValue(moraleEffect)
  const calculateEffectiveStrengthsForRowSpy = jest
    .spyOn(CalculateGameEffectiveStrengths as any, 'calculateEffectiveStrengthsForRow')
    .mockImplementation()

  const effects = [TestUtil.getDbEffect({})]
  const units = [TestUtil.getDbUnit({})]
  const newDeckUnit = TestUtil.getDbDeckUnit({})
  const gamePlayer1 = TestUtil.getDbGamePlayer({
    rounds: [
      TestUtil.getDbPlayerRound({}),
      TestUtil.getDbPlayerRound({
        close: {
          score: 0,
          units: [TestUtil.getDbGameUnit({})],
        },
        ranged: {
          score: 0,
          units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
        },
        siege: {
          score: 0,
          units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
        },
      }),
    ],
  })
  const game = TestUtil.getDbGame({
    round: 2,
    players: [
      gamePlayer1,
      TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
              ],
            },
            ranged: {
              score: 0,
              units: [
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
              ],
            },
            siege: {
              score: 0,
              units: [
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
              ],
            },
          }),
        ],
      }),
    ],
    turn: gamePlayer1.user,
  })
  for (const rowResult of rowResults) {
    jest
      .spyOn(CalculateGameEffectiveStrengths as any, 'calculateEffectiveStrengthsForRow')
      .mockReturnValueOnce(rowResult)
  }

  expect(
    CalculateGameEffectiveStrengths.calculateEffectiveStrengths({
      logPrefix,
      effects,
      game,
      units,
      newDeckUnit,
    })
  ).toEqual(expected)

  expect(getEffectWithKeySpy.mock.calls).toEqual([
    [
      {
        effectKey: EffectKey.Morale,
        effects,
        logPrefix,
      },
    ],
  ])
  const calculateEffectiveStrengthsForRowCall = {
    units,
    logPrefix,
    newDeckUnit,
    moraleEffect,
    currentPlayerId: game.turn,
  }
  expect(calculateEffectiveStrengthsForRowSpy.mock.calls).toEqual([
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[0].user,
        row: game.players[0].rounds[1].close,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[0].user,
        row: game.players[0].rounds[1].ranged,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[0].user,
        row: game.players[0].rounds[1].siege,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[1].user,
        row: game.players[1].rounds[1].close,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[1].user,
        row: game.players[1].rounds[1].ranged,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[1].user,
        row: game.players[1].rounds[1].siege,
      },
    ],
  ])
}

function testCalculateEffectiveStrengthsForRow({
  row,
  units,
  logPrefix = 'log-prefix',
  expected,
  applyMoralesResponses,
  modifiedRow,
  errorCalls = [],
}: {
  row: PlayerCombatRowDbObject
  units: UnitDbObject[]
  logPrefix?: string
  expected: ImpactDbObject[] | Error
  applyMoralesResponses?: ImpactDbObject[][]
  modifiedRow: PlayerCombatRowDbObject
  errorCalls?: string[][]
}) {
  const currentPlayerId = new ObjectId()
  const userId = new ObjectId()
  const moraleEffect = TestUtil.getDbEffect({})
  const moraleIdsInRow = [moraleEffect?._id.toString()]
  const newDeckUnit = TestUtil.getDbDeckUnit({})

  const getUnitsWithMoraleSpy = jest.spyOn(EffectMorale, 'getUnitsWithMorale').mockReturnValue(moraleIdsInRow)
  const applyMoralesSpy = jest.spyOn(EffectMorale, 'applyMorales')
  if (applyMoralesResponses) {
    for (const applyMoralesResponse of applyMoralesResponses) {
      applyMoralesSpy.mockReturnValueOnce(applyMoralesResponse)
    }
  }
  const errorSpy = jest.fn().mockImplementation()
  CalculateGameEffectiveStrengths['logger'] = {
    error: errorSpy,
  } as any

  if (expected instanceof Error) {
    expect(() =>
      CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
        currentPlayerId,
        logPrefix,
        moraleEffect,
        newDeckUnit,
        row,
        units,
        userId,
      })
    ).toThrow(expected)
  } else {
    expect(
      CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
        currentPlayerId,
        logPrefix,
        moraleEffect,
        newDeckUnit,
        row,
        units,
        userId,
      })
    ).toEqual(expected)
  }

  expect(getUnitsWithMoraleSpy.mock.calls).toEqual(
    expected instanceof Error
      ? []
      : [
          [
            {
              logPrefix,
              moraleEffect,
              units,
            },
          ],
        ]
  )
  expect(row).toEqual(modifiedRow)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
