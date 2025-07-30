import { ObjectId } from 'mongodb'

import {
  Combat,
  GameUnitOrigin,
  MoveUnitDbObject,
  PlayerCombatRowDbObject,
  PlayerRoundDbObject,
  RoundResult,
} from '@gwent/graphql-schema/database-typings'
import { GameUnit, Move, MoveReasonType, PlayerRound, Unit } from '@gwent/graphql-schema/resolver-typings'
import GameUnitResolver from '../../src/graphql/resolvers/types/game-unit-resolver'
import { MoveType } from '@gwent/graphql-schema'
import MoveResolver from '../../src/graphql/resolvers/types/move-resolver'
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
    it('resolves game units and rounds without leader', async () => {
      await testFromArray({})
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

// TODO: continue re-writing this
async function testFromArray({
  rounds,
  unitFromIdsCalls,
}: {
  rounds: PlayerRoundDbObject[]
  unitFromIdsCalls?: any[][]
}) {
  const closeUnit: GameUnit = {
    artStyle: 1,
    effectiveStrength: 2,
    unit: TestUtil.getUnit({
      combats: [Combat.Close],
      strength: 1,
    }),
  }
  const rangedUnit: GameUnit = {
    artStyle: 2,
    effectiveStrength: 2,
    unit: TestUtil.getUnit({
      combats: [Combat.Close],
      strength: 2,
    }),
  }
  const siegeUnit: GameUnit = {
    artStyle: 3,
    effectiveStrength: 3,
    unit: TestUtil.getUnit({
      combats: [Combat.Close],
      strength: 3,
    }),
  }
  const close: PlayerCombatRowDbObject = {
    score: 1,
    units: [
      {
        artStyle: closeUnit.artStyle,
        effectiveStrength: closeUnit.effectiveStrength,
        unit: new ObjectId(closeUnit.unit.id),
      },
    ],
  }
  const ranged: PlayerCombatRowDbObject = {
    score: 2,
    units: [
      {
        artStyle: rangedUnit.artStyle,
        effectiveStrength: rangedUnit.effectiveStrength,
        unit: new ObjectId(rangedUnit.unit.id),
      },
    ],
  }
  const siege: PlayerCombatRowDbObject = {
    score: 3,
    units: [
      {
        artStyle: siegeUnit.artStyle,
        effectiveStrength: siegeUnit.effectiveStrength,
        unit: new ObjectId(siegeUnit.unit.id),
      },
    ],
  }
  const resolvedLeader = leader || TestUtil.getLeader({})
  const round1 = TestUtil.getDbPlayerRound({
    close,
    ranged,
    siege,
    moves: [
      {
        created: new Date(),
        unit: {
          artStyle: close.units[0].artStyle,
          unit: close.units[0].unit,
        },
        type: MoveType.Unit,
      },
      {
        created: new Date(),
        unit: {
          artStyle: ranged.units[0].artStyle,
          unit: ranged.units[0].unit,
        },
        type: MoveType.Unit,
      },
      {
        created: new Date(),
        unit: {
          artStyle: siege.units[0].artStyle,
          unit: siege.units[0].unit,
        },
        type: MoveType.Unit,
      },
      {
        created: new Date(),
        leader: new ObjectId(resolvedLeader.id),
        type: MoveType.Leader,
      },
    ],
    score: 6,
    result: RoundResult.Won,
  })
  const round2 = TestUtil.getDbPlayerRound({
    close,
    ranged,
    siege,
    moves: [
      {
        created: new Date(),
        unit: {
          artStyle: close.units[0].artStyle,
          unit: close.units[0].unit,
        },
        type: MoveType.Unit,
      },
      {
        created: new Date(),
        unit: {
          artStyle: ranged.units[0].artStyle,
          unit: ranged.units[0].unit,
        },
        type: MoveType.Unit,
      },
      {
        created: new Date(),
        unit: {
          artStyle: siege.units[0].artStyle,
          unit: siege.units[0].unit,
        },
        type: MoveType.Unit,
      },
      {
        created: new Date(),
        leader: new ObjectId(resolvedLeader.id),
        type: MoveType.Leader,
      },
    ],
    score: 12,
    result: RoundResult.Lost,
  })
  const resolvedCloseMove: Move = {
    created: round1.moves[0].created,
    unit: {
      artStyle: closeUnit.artStyle,
      unit: closeUnit.unit,
    },
    reason: {
      type: MoveReasonType.Deploy,
    },
    source: {
      origin: GameUnitOrigin.Hand,
    },
    __typename: 'MoveUnit',
  }
  const resolvedRangedMove: Move = {
    created: round1.moves[1].created,
    unit: {
      artStyle: closeUnit.artStyle,
      unit: closeUnit.unit,
    },
    reason: {
      type: MoveReasonType.Deploy,
    },
    source: {
      origin: GameUnitOrigin.Hand,
    },
    __typename: 'MoveUnit',
  }
  const resolvedSiegeMove: Move = {
    created: round1.moves[2].created,
    unit: {
      artStyle: closeUnit.artStyle,
      unit: closeUnit.unit,
    },
    reason: {
      type: MoveReasonType.Deploy,
    },
    source: {
      origin: GameUnitOrigin.Hand,
    },
    __typename: 'MoveUnit',
  }
  const resolvedLeaderMove: Move = {
    created: round1.moves[3].created,
    leader: resolvedLeader,
    __typename: 'MoveLeader',
  }

  const expected: PlayerRound[] = [
    {
      close: {
        score: round1.close.score,
        units: [closeUnit],
      },
      ranged: {
        score: round1.ranged.score,
        units: [rangedUnit],
      },
      siege: {
        score: round1.siege.score,
        units: [siegeUnit],
      },
      moves: [resolvedCloseMove, resolvedRangedMove, resolvedSiegeMove, resolvedLeaderMove],
      score: round1.score,
      passed: round1.passed,
      result: RoundResult.Won,
    },
    {
      close: {
        score: round2.close.score,
        units: [closeUnit],
      },
      ranged: {
        score: round2.ranged.score,
        units: [rangedUnit],
      },
      siege: {
        score: round2.siege.score,
        units: [siegeUnit],
      },
      moves: [resolvedCloseMove, resolvedRangedMove, resolvedSiegeMove, resolvedLeaderMove],
      score: round2.score,
      passed: round2.passed,
      result: RoundResult.Lost,
    },
  ]

  const unitsFromIdsSpy = jest
    .spyOn(UnitResolver, 'fromIds')
    .mockResolvedValue([closeUnit.unit, rangedUnit.unit, siegeUnit.unit])
  const playerMoveFromObjectSpy = jest
    .spyOn(PlayerRoundResolver, 'fromObject')
    .mockResolvedValueOnce(expected[0])
    .mockResolvedValueOnce(expected[1])

  await expect(
    PlayerRoundResolver.fromArray({
      rounds: [round1, round2],
    })
  ).resolves.toEqual(expected)

  expect(unitsFromIdsSpy.mock.calls).toEqual([
    [
      {
        ids: [
          close.units[0].unit,
          ranged.units[0].unit,
          siege.units[0].unit,
          close.units[0].unit,
          ranged.units[0].unit,
          siege.units[0].unit,
        ],
      },
    ],
  ])
  expect(playerMoveFromObjectSpy.mock.calls).toEqual([
    [
      {
        round: round1,
        units: [closeUnit.unit, rangedUnit.unit, siegeUnit.unit],
        leader,
      },
    ],
    [
      {
        round: round2,
        units: [closeUnit.unit, rangedUnit.unit, siegeUnit.unit],
        leader,
      },
    ],
  ])
}
