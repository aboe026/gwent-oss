import { GameUnit, Move, MoveReasonType, PlayerRound, Unit } from '@gwent/graphql-schema/resolver-typings'
import GameUnitResolver from '../../src/graphql/resolvers/types/game-unit-resolver'
import MoveResolver from '../../src/graphql/resolvers/types/move-resolver'
import { MoveType } from '@gwent/graphql-schema'
import { MoveUnitDbObject, PlayerRoundDbObject, RoundResult } from '@gwent/graphql-schema/database-typings'
import PlayerRoundResolver from '../../src/graphql/resolvers/types/player-round-resolver'
import TestUtil from '../util/test-util'
import UnitResolver from '../../src/graphql/resolvers/types/unit-resolver'

describe('player-round-resolver', () => {
  describe('fromObject', () => {
    it('resolves game units if not provided', async () => {
      const round = TestUtil.getDbPlayerRound({
        passed: false,
        score: 4,
        close: {
          score: 1,
          units: [TestUtil.getDbGameUnit({})],
        },
        ranged: {
          score: 2,
          units: [TestUtil.getDbGameUnit({})],
        },
        siege: {
          score: 3,
          units: [TestUtil.getDbGameUnit({})],
        },
      })
      const units = [
        TestUtil.getUnit({
          id: round.close.units[0].unit,
        }),
        TestUtil.getUnit({
          id: round.ranged.units[0].unit,
        }),
        TestUtil.getUnit({
          id: round.siege.units[0].unit,
        }),
      ]
      const gameUnits: GameUnit[][] = [
        [
          TestUtil.getGameUnitFromDbGameUnit({
            gameUnit: round.close.units[0],
            unit: units[0],
          }),
        ],
        [
          TestUtil.getGameUnitFromDbGameUnit({
            gameUnit: round.ranged.units[0],
            unit: units[1],
          }),
        ],
        [
          TestUtil.getGameUnitFromDbGameUnit({
            gameUnit: round.siege.units[0],
            unit: units[2],
          }),
        ],
      ]
      await testFromObject({
        round,
        resolvedUnits: units,
        gameUnitsFromArrays: gameUnits,
        expected: {
          moves: [],
          passed: false,
          score: 4,
          close: {
            score: 1,
            units: gameUnits[0],
          },
          ranged: {
            score: 2,
            units: gameUnits[1],
          },
          siege: {
            score: 3,
            units: gameUnits[2],
          },
        },
        unitsFromIdsCalls: [
          [
            {
              ids: [
                round.close.units[0].unit.toString(),
                round.ranged.units[0].unit.toString(),
                round.siege.units[0].unit.toString(),
              ],
            },
          ],
        ],
      })
    })
    it('does not resolve game units if already provided', async () => {
      const round = TestUtil.getDbPlayerRound({
        result: RoundResult.Won,
        passed: false,
        score: 4,
        close: {
          score: 1,
          units: [TestUtil.getDbGameUnit({})],
        },
        ranged: {
          score: 2,
          units: [TestUtil.getDbGameUnit({})],
        },
        siege: {
          score: 3,
          units: [TestUtil.getDbGameUnit({})],
        },
      })
      const units = [
        TestUtil.getUnit({
          id: round.close.units[0].unit,
        }),
        TestUtil.getUnit({
          id: round.ranged.units[0].unit,
        }),
        TestUtil.getUnit({
          id: round.siege.units[0].unit,
        }),
      ]
      const gameUnits: GameUnit[][] = [
        [
          TestUtil.getGameUnitFromDbGameUnit({
            gameUnit: round.close.units[0],
            unit: units[0],
          }),
        ],
        [
          TestUtil.getGameUnitFromDbGameUnit({
            gameUnit: round.ranged.units[0],
            unit: units[1],
          }),
        ],
        [
          TestUtil.getGameUnitFromDbGameUnit({
            gameUnit: round.siege.units[0],
            unit: units[2],
          }),
        ],
      ]
      await testFromObject({
        round,
        units,
        gameUnitsFromArrays: gameUnits,
        expected: {
          result: RoundResult.Won,
          moves: [],
          passed: false,
          score: 4,
          close: {
            score: 1,
            units: gameUnits[0],
          },
          ranged: {
            score: 2,
            units: gameUnits[1],
          },
          siege: {
            score: 3,
            units: gameUnits[2],
          },
        },
        unitsFromIdsCalls: [
          [
            {
              ids: [],
            },
          ],
        ],
      })
    })
    it('resolves subset of game units of only some provided', async () => {
      const round = TestUtil.getDbPlayerRound({
        result: RoundResult.Won,
        passed: false,
        score: 4,
        close: {
          score: 1,
          units: [TestUtil.getDbGameUnit({})],
        },
        ranged: {
          score: 2,
          units: [TestUtil.getDbGameUnit({})],
        },
        siege: {
          score: 3,
          units: [TestUtil.getDbGameUnit({})],
        },
      })
      const units = [
        TestUtil.getUnit({
          id: round.close.units[0].unit,
        }),
        TestUtil.getUnit({
          id: round.ranged.units[0].unit,
        }),
        TestUtil.getUnit({
          id: round.siege.units[0].unit,
        }),
      ]
      const gameUnits: GameUnit[][] = [
        [
          TestUtil.getGameUnitFromDbGameUnit({
            gameUnit: round.close.units[0],
            unit: units[0],
          }),
        ],
        [
          TestUtil.getGameUnitFromDbGameUnit({
            gameUnit: round.ranged.units[0],
            unit: units[1],
          }),
        ],
        [
          TestUtil.getGameUnitFromDbGameUnit({
            gameUnit: round.siege.units[0],
            unit: units[2],
          }),
        ],
      ]
      await testFromObject({
        round,
        units: [units[0], units[2]],
        // resolvedUnits: [units[1]],
        gameUnitsFromArrays: gameUnits,
        expected: {
          result: RoundResult.Won,
          moves: [],
          passed: false,
          score: 4,
          close: {
            score: 1,
            units: gameUnits[0],
          },
          ranged: {
            score: 2,
            units: gameUnits[1],
          },
          siege: {
            score: 3,
            units: gameUnits[2],
          },
        },
        unitsFromIdsCalls: [
          [
            {
              ids: [units[1].id],
            },
          ],
        ],
      })
    })
    it('resolves move units if no units provided', async () => {
      const gameUnit = TestUtil.getDbGameUnit({})
      const round = TestUtil.getDbPlayerRound({
        moves: [
          TestUtil.getDbMove({
            type: MoveType.Unit,
          }),
          TestUtil.getDbMove({
            type: MoveType.Unit,
            reason: {
              type: MoveReasonType.Deploy,
              unit: gameUnit,
            },
          }),
          TestUtil.getDbMove({
            type: MoveType.Pass,
          }),
        ],
      })
      const units = [
        TestUtil.getUnit({
          id: (round.moves[0] as MoveUnitDbObject).unit.unit,
        }),
        TestUtil.getUnit({
          id: (round.moves[1] as MoveUnitDbObject).unit.unit,
        }),
        TestUtil.getUnit({
          id: gameUnit.unit,
        }),
      ]
      await testFromObject({
        round,
        resolvedUnits: units,
        expected: {
          result: undefined,
          moves: [],
          passed: false,
          score: 0,
          close: {
            score: 0,
            units: [],
          },
          ranged: {
            score: 0,
            units: [],
          },
          siege: {
            score: 0,
            units: [],
          },
        },
        unitsFromIdsCalls: [
          [
            {
              ids: [
                (round.moves[0] as MoveUnitDbObject).unit.unit.toString(),
                (round.moves[1] as MoveUnitDbObject).unit.unit.toString(),
                gameUnit.unit.toString(),
              ],
            },
          ],
        ],
      })
    })
    it('does not resolve move units if units already provided', async () => {
      const gameUnit = TestUtil.getDbGameUnit({})
      const round = TestUtil.getDbPlayerRound({
        moves: [
          TestUtil.getDbMove({
            type: MoveType.Unit,
          }),
          TestUtil.getDbMove({
            type: MoveType.Unit,
            reason: {
              type: MoveReasonType.Deploy,
              unit: gameUnit,
            },
          }),
          TestUtil.getDbMove({
            type: MoveType.Pass,
          }),
        ],
      })
      const units = [
        TestUtil.getUnit({
          id: (round.moves[0] as MoveUnitDbObject).unit.unit,
        }),
        TestUtil.getUnit({
          id: (round.moves[1] as MoveUnitDbObject).unit.unit,
        }),
        TestUtil.getUnit({
          id: gameUnit.unit,
        }),
      ]
      await testFromObject({
        round,
        units,
        expected: {
          result: undefined,
          moves: [],
          passed: false,
          score: 0,
          close: {
            score: 0,
            units: [],
          },
          ranged: {
            score: 0,
            units: [],
          },
          siege: {
            score: 0,
            units: [],
          },
        },
        unitsFromIdsCalls: [
          [
            {
              ids: [],
            },
          ],
        ],
      })
    })
    it('resolves subset of move units if some units provided', async () => {
      const gameUnit = TestUtil.getDbGameUnit({})
      const round = TestUtil.getDbPlayerRound({
        moves: [
          TestUtil.getDbMove({
            type: MoveType.Unit,
          }),
          TestUtil.getDbMove({
            type: MoveType.Unit,
            reason: {
              type: MoveReasonType.Deploy,
              unit: gameUnit,
            },
          }),
          TestUtil.getDbMove({
            type: MoveType.Pass,
          }),
        ],
      })
      const units = [
        TestUtil.getUnit({
          id: (round.moves[0] as MoveUnitDbObject).unit.unit,
        }),
        TestUtil.getUnit({
          id: (round.moves[1] as MoveUnitDbObject).unit.unit,
        }),
        TestUtil.getUnit({
          id: gameUnit.unit,
        }),
      ]
      await testFromObject({
        round,
        units: [units[0], units[2]],
        resolvedUnits: [units[1]],
        expected: {
          result: undefined,
          moves: [],
          passed: false,
          score: 0,
          close: {
            score: 0,
            units: [],
          },
          ranged: {
            score: 0,
            units: [],
          },
          siege: {
            score: 0,
            units: [],
          },
        },
        unitsFromIdsCalls: [
          [
            {
              ids: [(round.moves[1] as MoveUnitDbObject).unit.unit.toString()],
            },
          ],
        ],
      })
    })
  })
  describe('fromArray', () => {
    it('returns empty array if given empty array', async () => {
      await testFromArray({
        rounds: [],
      })
    })
    it('returns single round', async () => {
      const gameUnits = [
        TestUtil.getDbGameUnit({}),
        TestUtil.getDbGameUnit({}),
        TestUtil.getDbGameUnit({}),
        TestUtil.getDbGameUnit({}),
        TestUtil.getDbGameUnit({}),
        TestUtil.getDbGameUnit({}),
      ]
      await testFromArray({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 1,
              units: [gameUnits[0]],
            },
            ranged: {
              score: 2,
              units: [gameUnits[1]],
            },
            siege: {
              score: 3,
              units: [gameUnits[2]],
            },
            moves: [
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: gameUnits[3],
                reason: {
                  type: MoveReasonType.Deploy,
                  unit: gameUnits[4],
                },
              }),
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: gameUnits[5],
              }),
              TestUtil.getDbMove({
                type: MoveType.Pass,
              }),
            ],
          }),
        ],
        unitFromIdsCalls: [
          [
            {
              ids: [
                gameUnits[0].unit.toString(),
                gameUnits[1].unit.toString(),
                gameUnits[2].unit.toString(),
                gameUnits[3].unit.toString(),
                gameUnits[4].unit.toString(),
                gameUnits[5].unit.toString(),
              ],
            },
          ],
        ],
      })
    })
    it('returns multiple rounds', async () => {
      const gameUnits = [
        TestUtil.getDbGameUnit({}),
        TestUtil.getDbGameUnit({}),
        TestUtil.getDbGameUnit({}),
        TestUtil.getDbGameUnit({}),
        TestUtil.getDbGameUnit({}),
      ]
      await testFromArray({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 1,
              units: [gameUnits[0]],
            },
            ranged: {
              score: 2,
              units: [gameUnits[1]],
            },
            siege: {
              score: 3,
              units: [gameUnits[2]],
            },
            moves: [
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: gameUnits[0],
              }),
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: gameUnits[1],
                reason: {
                  type: MoveReasonType.Deploy,
                  unit: gameUnits[0],
                },
              }),
            ],
          }),
          TestUtil.getDbPlayerRound({
            close: {
              score: 4,
              units: [gameUnits[2]],
            },
            ranged: {
              score: 5,
              units: [gameUnits[3]],
            },
            siege: {
              score: 6,
              units: [gameUnits[4]],
            },
            moves: [
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: gameUnits[3],
              }),
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: gameUnits[4],
                reason: {
                  type: MoveReasonType.Deploy,
                  unit: gameUnits[3],
                },
              }),
            ],
          }),
        ],
        unitFromIdsCalls: [
          [
            {
              ids: [
                gameUnits[0].unit.toString(),
                gameUnits[1].unit.toString(),
                gameUnits[2].unit.toString(),
                gameUnits[3].unit.toString(),
                gameUnits[4].unit.toString(),
              ],
            },
          ],
        ],
      })
    })
  })
})

async function testFromObject({
  round,
  units,
  resolvedUnits = [],
  gameUnitsFromArrays = [[], [], []],
  movesFromArray = [],
  expected,
  unitsFromIdsCalls = [],
}: {
  round: PlayerRoundDbObject
  units?: Unit[]
  resolvedUnits?: Unit[]
  gameUnitsFromArrays?: GameUnit[][]
  movesFromArray?: Move[]
  expected: PlayerRound
  unitsFromIdsCalls?: any[][]
}) {
  const unitsFromIdsSpy = jest.spyOn(UnitResolver, 'fromIds').mockResolvedValue(resolvedUnits)
  const gameUnitsFromArraySpy = jest.spyOn(GameUnitResolver, 'fromArray')
  for (const gameUnitsFromArray of gameUnitsFromArrays) {
    gameUnitsFromArraySpy.mockResolvedValueOnce(gameUnitsFromArray)
  }
  const movesFromArraySpy = jest.spyOn(MoveResolver, 'fromArray').mockResolvedValue(movesFromArray)

  await expect(
    PlayerRoundResolver.fromObject({
      round,
      units,
    })
  ).resolves.toEqual(expected)

  expect(unitsFromIdsSpy.mock.calls).toEqual(unitsFromIdsCalls)
  const allUnits = units ? units : []
  allUnits.push(...resolvedUnits)
  expect(gameUnitsFromArraySpy.mock.calls).toEqual([
    [
      {
        gameUnits: round.close.units,
        units: allUnits,
      },
    ],
    [
      {
        gameUnits: round.ranged.units,
        units: allUnits,
      },
    ],
    [
      {
        gameUnits: round.siege.units,
        units: allUnits,
      },
    ],
  ])
  expect(movesFromArraySpy.mock.calls).toEqual([
    [
      {
        moves: round.moves,
        units: allUnits,
      },
    ],
  ])
}

async function testFromArray({
  rounds,
  unitFromIdsCalls = [
    [
      {
        ids: [],
      },
    ],
  ],
}: {
  rounds: PlayerRoundDbObject[]
  unitFromIdsCalls?: any[][]
}) {
  const units = [TestUtil.getUnit({})]
  const unitsFromIdsSpy = jest.spyOn(UnitResolver, 'fromIds').mockResolvedValue(units)
  const playerRoundFromObjectSpy = jest.spyOn(PlayerRoundResolver, 'fromObject')
  let resolvedRounds: PlayerRound[] = []
  for (const round of rounds) {
    const resolvedRound: PlayerRound = {
      close: {
        score: 0,
        units: [],
      },
      ranged: {
        score: 0,
        units: [],
      },
      siege: {
        score: 0,
        units: [],
      },
      moves: [],
      passed: false,
      score: 0,
    }
    playerRoundFromObjectSpy.mockResolvedValueOnce(resolvedRound)
    resolvedRounds.push(resolvedRound)
  }

  await expect(
    PlayerRoundResolver.fromArray({
      rounds,
    })
  ).resolves.toEqual(resolvedRounds)

  expect(unitsFromIdsSpy.mock.calls).toEqual(unitFromIdsCalls)
}
