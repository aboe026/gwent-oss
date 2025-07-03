import { ObjectId } from 'mongodb'

import { Combat, MoveUnitDbObject, PlayerCombatRowDbObject, RoundResult } from '@gwent/graphql-schema/database-typings'
import { GameUnit, Leader, Move, PlayerRound } from '@gwent/graphql-schema/resolver-typings'
import GameUnitResolver from '../../src/graphql/resolvers/types/game-unit-resolver'
import { MoveType } from '@gwent/graphql-schema'
import MoveResolver from '../../src/graphql/resolvers/types/move-resolver'
import PlayerRoundResolver from '../../src/graphql/resolvers/types/player-round-resolver'
import TestUtil from '../util/test-util'
import UnitResolver from '../../src/graphql/resolvers/types/unit-resolver'

describe('player-round-resolver', () => {
  describe('fromObject', () => {
    it('resolves game units if none provided', async () => {
      await testFromObject({})
    })
    it('does not resolve game units if provided', async () => {
      await testFromObject({
        units: true,
        leader: TestUtil.getLeader({}),
        result: RoundResult.Won,
      })
    })
  })
  describe('fromArray', () => {
    it('resolves game units and rounds without leader', async () => {
      await testFromArray({})
    })
    it('resolves game units and rounds with leader', async () => {
      await testFromArray({
        leader: TestUtil.getLeader({}),
      })
    })
  })
})

async function testFromObject({ units, leader, result }: { units?: boolean; leader?: Leader; result?: RoundResult }) {
  const closeUnit: GameUnit = {
    artStyle: 1,
    effectiveStrength: 2,
    unit: TestUtil.getUnit({
      combats: [Combat.Close],
      strength: 1,
    }),
    effects: [],
    row: undefined,
  }
  const rangedUnit: GameUnit = {
    artStyle: 2,
    effectiveStrength: 2,
    unit: TestUtil.getUnit({
      combats: [Combat.Close],
      strength: 2,
    }),
    effects: [],
    row: undefined,
  }
  const siegeUnit: GameUnit = {
    artStyle: 3,
    effectiveStrength: 3,
    unit: TestUtil.getUnit({
      combats: [Combat.Close],
      strength: 3,
    }),
    effects: [],
    row: undefined,
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
  const round = TestUtil.getDbPlayerRound({
    close,
    ranged,
    siege,
    moves: [
      {
        created: new Date(),
        unit: {
          artStyle: close.units[0].artStyle,
          unit: close.units[0].unit,
          effects: [],
          row: undefined,
        },
        type: MoveType.Unit,
      },
      {
        created: new Date(),
        unit: {
          artStyle: ranged.units[0].artStyle,
          unit: ranged.units[0].unit,
          effects: [],
          row: undefined,
        },
        type: MoveType.Unit,
      },
      {
        created: new Date(),
        unit: {
          artStyle: siege.units[0].artStyle,
          unit: siege.units[0].unit,
          effects: [],
          row: undefined,
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
    result,
  })
  const resolvedCloseMove: Move = {
    created: round.moves[0].created,
    unit: {
      artStyle: closeUnit.artStyle,
      unit: closeUnit.unit,
      effects: [],
      row: undefined,
    },
    __typename: 'MoveUnit',
  }
  const resolvedRangedMove: Move = {
    created: round.moves[1].created,
    unit: {
      artStyle: closeUnit.artStyle,
      unit: closeUnit.unit,
      effects: [],
      row: undefined,
    },
    __typename: 'MoveUnit',
  }
  const resolvedSiegeMove: Move = {
    created: round.moves[2].created,
    unit: {
      artStyle: closeUnit.artStyle,
      unit: closeUnit.unit,
      effects: [],
      row: undefined,
    },
    __typename: 'MoveUnit',
  }
  const resolvedLeaderMove: Move = {
    created: round.moves[3].created,
    leader: resolvedLeader,
    __typename: 'MoveLeader',
  }

  const unitsFromIdsSpy = jest
    .spyOn(UnitResolver, 'fromIds')
    .mockResolvedValue([closeUnit.unit, rangedUnit.unit, siegeUnit.unit])
  const gameUnitFromObject = jest
    .spyOn(GameUnitResolver, 'fromObject')
    .mockResolvedValueOnce(closeUnit)
    .mockResolvedValueOnce(rangedUnit)
    .mockResolvedValueOnce(siegeUnit)
  const playerMoveFromObjectSpy = jest
    .spyOn(MoveResolver, 'fromObject')
    .mockResolvedValueOnce(resolvedCloseMove)
    .mockResolvedValueOnce(resolvedRangedMove)
    .mockResolvedValueOnce(resolvedSiegeMove)
    .mockResolvedValueOnce(resolvedLeaderMove)
  const gameUnitFromArraySpy = jest
    .spyOn(GameUnitResolver, 'fromArray')
    .mockResolvedValueOnce([closeUnit])
    .mockResolvedValueOnce([rangedUnit])
    .mockResolvedValueOnce([siegeUnit])

  const expected: PlayerRound = {
    close: {
      score: round.close.score,
      units: [closeUnit],
    },
    ranged: {
      score: round.ranged.score,
      units: [rangedUnit],
    },
    siege: {
      score: round.siege.score,
      units: [siegeUnit],
    },
    moves: [resolvedCloseMove, resolvedRangedMove, resolvedSiegeMove, resolvedLeaderMove],
    score: round.score,
    passed: round.passed,
    result,
  }
  await expect(
    PlayerRoundResolver.fromObject({
      round,
      units: units ? [closeUnit.unit, rangedUnit.unit, siegeUnit.unit] : undefined,
      leader: leader,
    })
  ).resolves.toEqual(expected)

  expect(unitsFromIdsSpy.mock.calls).toEqual(
    units
      ? []
      : [
          [
            {
              ids: [new ObjectId(closeUnit.unit.id), new ObjectId(rangedUnit.unit.id), new ObjectId(siegeUnit.unit.id)],
            },
          ],
        ]
  )
  expect(gameUnitFromObject.mock.calls).toEqual([
    [
      {
        gameUnit: (round.moves[0] as MoveUnitDbObject).unit,
        unit: closeUnit.unit,
      },
    ],
    [
      {
        gameUnit: (round.moves[1] as MoveUnitDbObject).unit,
        unit: rangedUnit.unit,
      },
    ],
    [
      {
        gameUnit: (round.moves[2] as MoveUnitDbObject).unit,
        unit: siegeUnit.unit,
      },
    ],
  ])
  expect(playerMoveFromObjectSpy.mock.calls).toEqual([
    [
      {
        move: round.moves[0],
        gameUnit: closeUnit,
        leader: undefined,
      },
    ],
    [
      {
        move: round.moves[1],
        gameUnit: rangedUnit,
        leader: undefined,
      },
    ],
    [
      {
        move: round.moves[2],
        gameUnit: siegeUnit,
        leader: undefined,
      },
    ],
    [
      {
        move: round.moves[3],
        gameUnit: undefined,
        leader,
      },
    ],
  ])
  expect(gameUnitFromArraySpy.mock.calls).toEqual([
    [
      {
        gameUnits: round.close.units,
        units: [closeUnit.unit, rangedUnit.unit, siegeUnit.unit],
      },
    ],
    [
      {
        gameUnits: round.ranged.units,
        units: [closeUnit.unit, rangedUnit.unit, siegeUnit.unit],
      },
    ],
    [
      {
        gameUnits: round.siege.units,
        units: [closeUnit.unit, rangedUnit.unit, siegeUnit.unit],
      },
    ],
  ])
}

async function testFromArray({ leader }: { leader?: Leader }) {
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
    __typename: 'MoveUnit',
  }
  const resolvedRangedMove: Move = {
    created: round1.moves[1].created,
    unit: {
      artStyle: closeUnit.artStyle,
      unit: closeUnit.unit,
    },
    __typename: 'MoveUnit',
  }
  const resolvedSiegeMove: Move = {
    created: round1.moves[2].created,
    unit: {
      artStyle: closeUnit.artStyle,
      unit: closeUnit.unit,
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
      leader,
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
