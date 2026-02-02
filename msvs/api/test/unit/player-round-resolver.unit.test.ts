import CombatRowResolver from '../../src/graphql/resolvers/types/combat-row-resolver'
import { GameUnit, Move, MoveReasonType, PlayerRound, Unit, User } from '@gwent/graphql-schema/resolver-typings'
import GameUnitResolver from '../../src/graphql/resolvers/types/game-unit-resolver'
import MoveResolver from '../../src/graphql/resolvers/types/move-resolver'
import { MoveType } from '@gwent/graphql-schema'
import { PlayerRoundDbObject, RoundResult } from '@gwent/graphql-schema/database-typings'
import PlayerRoundResolver from '../../src/graphql/resolvers/types/player-round-resolver'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('player-round-resolver', () => {
  describe('fromObject', () => {
    it('resolves units and users if not provided', async () => {
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
        weathers: [TestUtil.getDbGameUnit({})],
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
        TestUtil.getUnit({
          id: round.weathers[0].unit,
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
        [
          TestUtil.getGameUnitFromDbGameUnit({
            gameUnit: round.siege.units[0],
            unit: units[3],
          }),
        ],
      ]
      await testFromObject({
        round,
        resolvedUnits: units,
        resolvedUsers: [TestUtil.getUser({})],
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
          weathers: gameUnits[3],
        },
      })
    })
    it('does not resolve units or users if already provided', async () => {
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
        weathers: [TestUtil.getDbGameUnit({})],
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
        TestUtil.getUnit({
          id: round.weathers[0].unit,
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
        [
          TestUtil.getGameUnitFromDbGameUnit({
            gameUnit: round.weathers[0],
            unit: units[3],
          }),
        ],
      ]
      await testFromObject({
        round,
        units,
        users: [TestUtil.getUser({})],
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
          weathers: gameUnits[3],
        },
      })
    })
  })
  describe('fromArray', () => {
    it('returns empty array if given empty array', async () => {
      await testFromArray({
        rounds: [],
      })
    })
    it('returns rounds without prefetched input', async () => {
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
        resolvedUnits: gameUnits.map((gameUnit) =>
          TestUtil.getUnit({
            id: gameUnit.unit,
          })
        ),
        resolvedUsers: [TestUtil.getUser({}), TestUtil.getUser({})],
      })
    })
    it('returns rounds with prefetched input', async () => {
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
        units: gameUnits.map((gameUnit) =>
          TestUtil.getUnit({
            id: gameUnit.unit,
          })
        ),
        users: [TestUtil.getUser({}), TestUtil.getUser({})],
      })
    })
  })
  describe('getGameUnits', () => {
    it('returns empty array if rounds empty', () => {
      expect(
        PlayerRoundResolver.getGameUnits({
          rounds: [],
        })
      ).toEqual([])
    })
    describe('single', () => {
      it('returns empty array if no units', () => {
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
        ).toEqual([])
      })
      it('returns single unit if single close unit', () => {
        const units = [TestUtil.getDbGameUnit({})]
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [units[0]],
                }),
              }),
            ],
          })
        ).toEqual(units)
      })
      it('returns single unit if single ranged unit', () => {
        const units = [TestUtil.getDbGameUnit({})]
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [units[0]],
                }),
              }),
            ],
          })
        ).toEqual(units)
      })
      it('returns single unit if single siege unit', () => {
        const units = [TestUtil.getDbGameUnit({})]
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [units[0]],
                }),
              }),
            ],
          })
        ).toEqual(units)
      })
      it('returns single unit if single close modifier', () => {
        const units = [TestUtil.getDbGameUnit({})]
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  modifier: units[0],
                }),
              }),
            ],
          })
        ).toEqual(units)
      })
      it('returns single unit if single ranged modifier', () => {
        const units = [TestUtil.getDbGameUnit({})]
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: TestUtil.getDbPlayerCombatRow({
                  modifier: units[0],
                }),
              }),
            ],
          })
        ).toEqual(units)
      })
      it('returns single unit if single siege modifier', () => {
        const units = [TestUtil.getDbGameUnit({})]
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: TestUtil.getDbPlayerCombatRow({
                  modifier: units[0],
                }),
              }),
            ],
          })
        ).toEqual(units)
      })
      it('returns single unit if single weather', () => {
        const units = [TestUtil.getDbGameUnit({})]
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [
              TestUtil.getDbPlayerRound({
                weathers: [units[0]],
              }),
            ],
          })
        ).toEqual(units)
      })
      it('returns multiple units if one of each', () => {
        const units = [
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
        ]
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [units[0]],
                  modifier: units[3],
                }),
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [units[1]],
                  modifier: units[4],
                }),
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [units[2]],
                  modifier: units[5],
                }),
                weathers: [units[6]],
              }),
            ],
          })
        ).toEqual(units)
      })
    })
    describe('multiple', () => {
      it('returns empty array if no units', () => {
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
        ).toEqual([])
      })
      it('returns units if single close units', () => {
        const units = [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})]
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [units[0]],
                }),
              }),
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [units[1]],
                }),
              }),
            ],
          })
        ).toEqual(units)
      })
      it('returns units if single ranged units', () => {
        const units = [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})]
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [units[0]],
                }),
              }),
              TestUtil.getDbPlayerRound({
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [units[1]],
                }),
              }),
            ],
          })
        ).toEqual(units)
      })
      it('returns units if single siege units', () => {
        const units = [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})]
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [units[0]],
                }),
              }),
              TestUtil.getDbPlayerRound({
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [units[1]],
                }),
              }),
            ],
          })
        ).toEqual(units)
      })
      it('returns units if single close modifiers', () => {
        const units = [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})]
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  modifier: units[0],
                }),
              }),
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  modifier: units[1],
                }),
              }),
            ],
          })
        ).toEqual(units)
      })
      it('returns units if single ranged modifiers', () => {
        const units = [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})]
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: TestUtil.getDbPlayerCombatRow({
                  modifier: units[0],
                }),
              }),
              TestUtil.getDbPlayerRound({
                ranged: TestUtil.getDbPlayerCombatRow({
                  modifier: units[1],
                }),
              }),
            ],
          })
        ).toEqual(units)
      })
      it('returns units if single siege modifiers', () => {
        const units = [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})]
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: TestUtil.getDbPlayerCombatRow({
                  modifier: units[0],
                }),
              }),
              TestUtil.getDbPlayerRound({
                siege: TestUtil.getDbPlayerCombatRow({
                  modifier: units[1],
                }),
              }),
            ],
          })
        ).toEqual(units)
      })
      it('returns units if single siege weathers', () => {
        const units = [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})]
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [
              TestUtil.getDbPlayerRound({
                weathers: [units[0]],
              }),
              TestUtil.getDbPlayerRound({
                weathers: [units[1]],
              }),
            ],
          })
        ).toEqual(units)
      })
      it('returns multiple units if one of each', () => {
        const units = [
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
          TestUtil.getDbGameUnit({}),
        ]
        expect(
          PlayerRoundResolver.getGameUnits({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [units[0]],
                  modifier: units[3],
                }),
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [units[1]],
                  modifier: units[4],
                }),
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [units[2]],
                  modifier: units[5],
                }),
                weathers: [units[6]],
              }),
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [units[7]],
                  modifier: units[10],
                }),
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [units[8]],
                  modifier: units[11],
                }),
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [units[9]],
                  modifier: units[12],
                }),
                weathers: [units[13]],
              }),
            ],
          })
        ).toEqual(units)
      })
    })
  })
})

async function testFromObject({
  round,
  units,
  users,
  resolvedUnits = [],
  resolvedUsers = [],
  movesFromArray = [],
  expected,
}: {
  round: PlayerRoundDbObject
  units?: Unit[]
  users?: User[]
  resolvedUnits?: Unit[]
  resolvedUsers?: User[]
  movesFromArray?: Move[]
  expected: PlayerRound
}) {
  const resolveUsersAndUnitsSpy = jest.spyOn(ResolverUtil, 'resolveUsersAndUnits').mockResolvedValue({
    users: users || resolvedUsers,
    units: units || resolvedUnits,
  })
  const resolvedWeathers = [
    TestUtil.getGameUnit({
      unit: (units || resolvedUnits)[3],
    }),
  ]
  const combatRowFromObjectSpy = jest
    .spyOn(CombatRowResolver, 'fromObject')
    .mockResolvedValueOnce(expected.close)
    .mockResolvedValueOnce(expected.ranged)
    .mockResolvedValueOnce(expected.siege)
  const movesFromArraySpy = jest.spyOn(MoveResolver, 'fromArray').mockResolvedValue(movesFromArray)
  const gameUnitFromArraySpy = jest.spyOn(GameUnitResolver, 'fromArray').mockResolvedValue(resolvedWeathers)

  await expect(
    PlayerRoundResolver.fromObject({
      round,
      units,
      users,
    })
  ).resolves.toEqual(expected)

  expect(resolveUsersAndUnitsSpy.mock.calls).toEqual([
    [
      {
        moves: round.moves,
        gameUnits: [...round.close.units, ...round.ranged.units, ...round.siege.units, ...round.weathers],
        presolvedUnits: units,
        presolvedUsers: users,
      },
    ],
  ])
  expect(combatRowFromObjectSpy.mock.calls).toEqual([
    [
      {
        row: round.close,
        units: units || resolvedUnits,
      },
    ],
    [
      {
        row: round.ranged,
        units: units || resolvedUnits,
      },
    ],
    [
      {
        row: round.siege,
        units: units || resolvedUnits,
      },
    ],
  ])
  expect(movesFromArraySpy.mock.calls).toEqual([
    [
      {
        moves: round.moves,
        units: units || resolvedUnits,
        users: users || resolvedUsers,
      },
    ],
  ])
  expect(gameUnitFromArraySpy.mock.calls).toEqual([
    [
      {
        gameUnits: round.weathers,
        units: units || resolvedUnits,
      },
    ],
  ])
}

async function testFromArray({
  rounds,
  units,
  users,
  resolvedUnits = [],
  resolvedUsers = [],
}: {
  rounds: PlayerRoundDbObject[]
  users?: User[]
  units?: Unit[]
  resolvedUsers?: User[]
  resolvedUnits?: Unit[]
}) {
  const resolveUsersAndUnitsSpy = jest.spyOn(ResolverUtil, 'resolveUsersAndUnits').mockResolvedValue({
    units: units || resolvedUnits,
    users: users || resolvedUsers,
  })
  const playerRoundFromObjectSpy = jest.spyOn(PlayerRoundResolver, 'fromObject')
  const resolvedRounds: PlayerRound[] = []
  const playerRoundFromObjectCalls: any[][] = []
  for (const round of rounds) {
    const resolvedRound: PlayerRound = {
      close: {
        score: round.close.score,
        units: [],
      },
      ranged: {
        score: round.ranged.score,
        units: [],
      },
      siege: {
        score: round.siege.score,
        units: [],
      },
      moves: [],
      passed: false,
      score: round.score,
      weathers: [],
    }
    playerRoundFromObjectSpy.mockResolvedValueOnce(resolvedRound)
    resolvedRounds.push(resolvedRound)
    playerRoundFromObjectCalls.push([
      {
        round,
        units: units || resolvedUnits,
        users: users || resolvedUsers,
      },
    ])
  }

  await expect(
    PlayerRoundResolver.fromArray({
      rounds,
      units,
      users,
    })
  ).resolves.toEqual(resolvedRounds)

  expect(resolveUsersAndUnitsSpy.mock.calls).toEqual(
    rounds.length === 0
      ? []
      : [
          [
            {
              moves: rounds.map((round) => round.moves).flat(),
              gameUnits: rounds
                .map((round) => [...round.close.units, ...round.ranged.units, ...round.siege.units])
                .flat(),
              presolvedUsers: users,
              presolvedUnits: units,
            },
          ],
        ]
  )
  expect(playerRoundFromObjectSpy.mock.calls).toEqual(playerRoundFromObjectCalls)
}
