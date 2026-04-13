import CombatRowResolver from '../../src/graphql/resolvers/types/combat-row-resolver'
import { FieldUnit, Move, MoveReasonType, PlayerRound, Unit, User } from '@gwent/graphql-schema/resolver-typings'
import MoveResolver from '../../src/graphql/resolvers/types/move-resolver'
import { MoveType } from '@gwent/graphql-schema'
import { PlayerRoundDbObject, RoundResult, WeatherUnit } from '@gwent/graphql-schema/database-typings'
import PlayerRoundResolver from '../../src/graphql/resolvers/types/player-round-resolver'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'
import WeatherUnitResolver from '../../src/graphql/resolvers/types/weather-unit-resolver'

describe('player-round-resolver', () => {
  describe('fromObject', () => {
    it('resolves units and users if not provided', async () => {
      const round = TestUtil.getDbPlayerRound({
        passed: false,
        score: 4,
        close: TestUtil.getDbPlayerCombatRow({
          score: 1,
          units: [TestUtil.getDbFieldUnit({})],
        }),
        ranged: TestUtil.getDbPlayerCombatRow({
          score: 2,
          units: [TestUtil.getDbFieldUnit({})],
        }),
        siege: TestUtil.getDbPlayerCombatRow({
          score: 3,
          units: [TestUtil.getDbFieldUnit({})],
        }),
        weathers: [TestUtil.getDbWeatherUnit({})],
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
      const fieldUnits: FieldUnit[][] = [
        [
          TestUtil.getFieldUnitFromDbFieldUnit({
            fieldUnit: round.close.units[0],
            unit: units[0],
          }),
        ],
        [
          TestUtil.getFieldUnitFromDbFieldUnit({
            fieldUnit: round.ranged.units[0],
            unit: units[1],
          }),
        ],
        [
          TestUtil.getFieldUnitFromDbFieldUnit({
            fieldUnit: round.siege.units[0],
            unit: units[2],
          }),
        ],
      ]
      const weatherUnit: WeatherUnit = TestUtil.getWeatherUnit({
        artStyle: round.weathers[0].artStyle,
        unit: units[3],
      })
      await testFromObject({
        round,
        resolvedUnits: units,
        resolvedUsers: [TestUtil.getUser({})],
        expected: {
          moves: [],
          passed: false,
          result: undefined,
          score: 4,
          close: TestUtil.getPlayerCombatRow({
            score: 1,
            units: fieldUnits[0],
          }),
          ranged: TestUtil.getPlayerCombatRow({
            score: 2,
            units: fieldUnits[1],
          }),
          siege: TestUtil.getPlayerCombatRow({
            score: 3,
            units: fieldUnits[2],
          }),
          weathers: [weatherUnit],
        },
      })
    })
    it('does not resolve units or users if already provided', async () => {
      const round = TestUtil.getDbPlayerRound({
        result: RoundResult.Won,
        passed: false,
        score: 4,
        close: TestUtil.getDbPlayerCombatRow({
          score: 1,
          units: [TestUtil.getDbFieldUnit({})],
        }),
        ranged: TestUtil.getDbPlayerCombatRow({
          score: 2,
          units: [TestUtil.getDbFieldUnit({})],
        }),
        siege: TestUtil.getDbPlayerCombatRow({
          score: 3,
          units: [TestUtil.getDbFieldUnit({})],
        }),
        weathers: [TestUtil.getDbWeatherUnit({})],
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
      const fieldUnits: FieldUnit[][] = [
        [
          TestUtil.getFieldUnitFromDbFieldUnit({
            fieldUnit: round.close.units[0],
            unit: units[0],
          }),
        ],
        [
          TestUtil.getFieldUnitFromDbFieldUnit({
            fieldUnit: round.ranged.units[0],
            unit: units[1],
          }),
        ],
        [
          TestUtil.getFieldUnitFromDbFieldUnit({
            fieldUnit: round.siege.units[0],
            unit: units[2],
          }),
        ],
      ]
      const weatherUnit = TestUtil.getWeatherUnit({
        artStyle: round.weathers[0].artStyle,
        unit: units[3],
      })
      await testFromObject({
        round,
        units,
        users: [TestUtil.getUser({})],
        expected: {
          result: RoundResult.Won,
          moves: [],
          passed: false,
          score: 4,
          close: TestUtil.getPlayerCombatRow({
            score: 1,
            units: fieldUnits[0],
          }),
          ranged: TestUtil.getPlayerCombatRow({
            score: 2,
            units: fieldUnits[1],
          }),
          siege: TestUtil.getPlayerCombatRow({
            score: 3,
            units: fieldUnits[2],
          }),
          weathers: [weatherUnit],
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
      const fieldUnits = [
        TestUtil.getDbFieldUnit({}),
        TestUtil.getDbFieldUnit({}),
        TestUtil.getDbFieldUnit({}),
        TestUtil.getDbFieldUnit({}),
        TestUtil.getDbFieldUnit({}),
        TestUtil.getDbFieldUnit({}),
      ]
      await testFromArray({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              score: 1,
              units: [fieldUnits[0]],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              score: 2,
              units: [fieldUnits[1]],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              score: 3,
              units: [fieldUnits[2]],
            }),
            moves: [
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: TestUtil.convertFieldDbUnitToTacoDbUnit(fieldUnits[0]),
              }),
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: TestUtil.convertFieldDbUnitToTacoDbUnit(fieldUnits[1]),
                reason: {
                  type: MoveReasonType.Deploy,
                  unit: fieldUnits[0],
                },
              }),
            ],
          }),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              score: 4,
              units: [fieldUnits[2]],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              score: 5,
              units: [fieldUnits[3]],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              score: 6,
              units: [fieldUnits[4]],
            }),
            moves: [
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: TestUtil.convertFieldDbUnitToTacoDbUnit(fieldUnits[3]),
              }),
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: TestUtil.convertFieldDbUnitToTacoDbUnit(fieldUnits[4]),
                reason: {
                  type: MoveReasonType.Deploy,
                  unit: TestUtil.convertFieldDbUnitToTacoDbUnit(fieldUnits[3]),
                },
              }),
            ],
          }),
        ],
        resolvedUnits: fieldUnits.map((fieldUnit) =>
          TestUtil.getUnit({
            id: fieldUnit.unit,
          })
        ),
        resolvedUsers: [TestUtil.getUser({}), TestUtil.getUser({})],
      })
    })
    it('returns rounds with prefetched input', async () => {
      const fieldUnits = [
        TestUtil.getDbFieldUnit({}),
        TestUtil.getDbFieldUnit({}),
        TestUtil.getDbFieldUnit({}),
        TestUtil.getDbFieldUnit({}),
        TestUtil.getDbFieldUnit({}),
        TestUtil.getDbFieldUnit({}),
      ]
      await testFromArray({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              score: 1,
              units: [fieldUnits[0]],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              score: 2,
              units: [fieldUnits[1]],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              score: 3,
              units: [fieldUnits[2]],
            }),
            moves: [
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: TestUtil.convertFieldDbUnitToTacoDbUnit(fieldUnits[0]),
              }),
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: TestUtil.convertFieldDbUnitToTacoDbUnit(fieldUnits[1]),
                reason: {
                  type: MoveReasonType.Deploy,
                  unit: fieldUnits[0],
                },
              }),
            ],
          }),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              score: 4,
              units: [fieldUnits[2]],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              score: 5,
              units: [fieldUnits[3]],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              score: 6,
              units: [fieldUnits[4]],
            }),
            moves: [
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: TestUtil.convertFieldDbUnitToTacoDbUnit(fieldUnits[3]),
              }),
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: TestUtil.convertFieldDbUnitToTacoDbUnit(fieldUnits[4]),
                reason: {
                  type: MoveReasonType.Deploy,
                  unit: fieldUnits[3],
                },
              }),
            ],
          }),
        ],
        units: fieldUnits.map((fieldUnit) =>
          TestUtil.getUnit({
            id: fieldUnit.unit,
          })
        ),
        users: [TestUtil.getUser({}), TestUtil.getUser({})],
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
    TestUtil.getWeatherUnit({
      unit: (units || resolvedUnits)[3],
    }),
  ]
  const combatRowFromObjectSpy = jest
    .spyOn(CombatRowResolver, 'fromObject')
    .mockResolvedValueOnce(expected.close)
    .mockResolvedValueOnce(expected.ranged)
    .mockResolvedValueOnce(expected.siege)
  const movesFromArraySpy = jest.spyOn(MoveResolver, 'fromArray').mockResolvedValue(movesFromArray)
  const weatherUnitFromArraySpy = jest.spyOn(WeatherUnitResolver, 'fromArray').mockResolvedValue(resolvedWeathers)

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
        fieldUnits: [...round.close.units, ...round.ranged.units, ...round.siege.units],
        weatherUnits: round.weathers,
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
  expect(weatherUnitFromArraySpy.mock.calls).toEqual([
    [
      {
        weatherUnits: round.weathers,
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
      close: TestUtil.getPlayerCombatRow({
        score: round.close.score,
      }),
      ranged: TestUtil.getPlayerCombatRow({
        score: round.ranged.score,
      }),
      siege: TestUtil.getPlayerCombatRow({
        score: round.siege.score,
      }),
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
              fieldUnits: rounds
                .map((round) => [...round.close.units, ...round.ranged.units, ...round.siege.units])
                .flat(),
              weatherUnits: rounds.map((round) => round.weathers).flat(),
              presolvedUsers: users,
              presolvedUnits: units,
            },
          ],
        ]
  )
  expect(playerRoundFromObjectSpy.mock.calls).toEqual(playerRoundFromObjectCalls)
}
