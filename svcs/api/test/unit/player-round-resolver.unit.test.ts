import { ObjectId } from 'mongodb'

import { Combat, PlayerCombatRowDbObject, RoundResult } from '@gwent/graphql-schema/database-typings'
import { GameUnit, Leader, Move, PlayerRound } from '@gwent/graphql-schema/resolver-typings'
import GameUnitResolver from '../../src/graphql/resolvers/types/game-unit-resolver'
import { MoveType } from '@gwent/graphql-schema'
import PlayerMoveResolver from '../../src/graphql/resolvers/types/player-move-resolver'
import PlayerRoundResolver from '../../src/graphql/resolvers/types/player-round-resolver'
import TestUtil from '../test-util'

describe('player-round-resolver', () => {
  describe('fromObject', () => {
    it('resolves game units if none provided', async () => {
      await testFromObject({})
    })
    it('does not resolve game units if provided', async () => {
      await testFromObject({
        gameUnits: true,
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

async function testFromObject({
  gameUnits,
  leader,
  result,
}: {
  gameUnits?: boolean
  leader?: Leader
  result?: RoundResult
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
  const round = TestUtil.getDbPlayerRound({
    close,
    ranged,
    siege,
    moves: [
      {
        created: new Date(),
        row: Combat.Close,
        unit: {
          artStyle: close.units[0].artStyle,
          unit: close.units[0].unit,
        },
        type: MoveType.Unit,
      },
      {
        created: new Date(),
        row: Combat.Ranged,
        unit: {
          artStyle: ranged.units[0].artStyle,
          unit: ranged.units[0].unit,
        },
        type: MoveType.Unit,
      },
      {
        created: new Date(),
        row: Combat.Siege,
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
    result,
  })
  const resolvedCloseMove: Move = {
    created: round.moves[0].created,
    row: Combat.Close,
    unit: {
      artStyle: closeUnit.artStyle,
      unit: closeUnit.unit,
    },
    __typename: 'MoveUnit',
  }
  const resolvedRangedMove: Move = {
    created: round.moves[1].created,
    row: Combat.Close,
    unit: {
      artStyle: closeUnit.artStyle,
      unit: closeUnit.unit,
    },
    __typename: 'MoveUnit',
  }
  const resolvedSiegeMove: Move = {
    created: round.moves[2].created,
    row: Combat.Close,
    unit: {
      artStyle: closeUnit.artStyle,
      unit: closeUnit.unit,
    },
    __typename: 'MoveUnit',
  }
  const resolvedLeaderMove: Move = {
    created: round.moves[3].created,
    leader: resolvedLeader,
    __typename: 'MoveLeader',
  }

  const gameUnitsFromArraySpy = jest
    .spyOn(GameUnitResolver, 'fromArray')
    .mockResolvedValue([closeUnit, rangedUnit, siegeUnit])
  const playerMoveFromObjectSpy = jest
    .spyOn(PlayerMoveResolver, 'fromObject')
    .mockResolvedValueOnce(resolvedCloseMove)
    .mockResolvedValueOnce(resolvedRangedMove)
    .mockResolvedValueOnce(resolvedSiegeMove)
    .mockResolvedValueOnce(resolvedLeaderMove)

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
      gameUnits: gameUnits ? [closeUnit, rangedUnit, siegeUnit] : undefined,
      leader: leader,
    })
  ).resolves.toEqual(expected)

  expect(gameUnitsFromArraySpy.mock.calls).toEqual(
    gameUnits
      ? []
      : [
          [
            {
              gameUnits: [close.units[0], ranged.units[0], siege.units[0]],
            },
          ],
        ]
  )
  expect(playerMoveFromObjectSpy.mock.calls).toEqual([
    [
      {
        move: round.moves[0],
        deckUnit: {
          artStyle: closeUnit.artStyle,
          unit: closeUnit.unit,
        },
        leader: undefined,
      },
    ],
    [
      {
        move: round.moves[1],
        deckUnit: {
          artStyle: rangedUnit.artStyle,
          unit: rangedUnit.unit,
        },
        leader: undefined,
      },
    ],
    [
      {
        move: round.moves[2],
        deckUnit: {
          artStyle: siegeUnit.artStyle,
          unit: siegeUnit.unit,
        },
        leader: undefined,
      },
    ],
    [
      {
        move: round.moves[3],
        deckUnit: undefined,
        leader,
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
        row: Combat.Close,
        unit: {
          artStyle: close.units[0].artStyle,
          unit: close.units[0].unit,
        },
        type: MoveType.Unit,
      },
      {
        created: new Date(),
        row: Combat.Ranged,
        unit: {
          artStyle: ranged.units[0].artStyle,
          unit: ranged.units[0].unit,
        },
        type: MoveType.Unit,
      },
      {
        created: new Date(),
        row: Combat.Siege,
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
        row: Combat.Close,
        unit: {
          artStyle: close.units[0].artStyle,
          unit: close.units[0].unit,
        },
        type: MoveType.Unit,
      },
      {
        created: new Date(),
        row: Combat.Ranged,
        unit: {
          artStyle: ranged.units[0].artStyle,
          unit: ranged.units[0].unit,
        },
        type: MoveType.Unit,
      },
      {
        created: new Date(),
        row: Combat.Siege,
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
    row: Combat.Close,
    unit: {
      artStyle: closeUnit.artStyle,
      unit: closeUnit.unit,
    },
    __typename: 'MoveUnit',
  }
  const resolvedRangedMove: Move = {
    created: round1.moves[1].created,
    row: Combat.Close,
    unit: {
      artStyle: closeUnit.artStyle,
      unit: closeUnit.unit,
    },
    __typename: 'MoveUnit',
  }
  const resolvedSiegeMove: Move = {
    created: round1.moves[2].created,
    row: Combat.Close,
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

  const gameUnitsFromArraySpy = jest
    .spyOn(GameUnitResolver, 'fromArray')
    .mockResolvedValue([closeUnit, rangedUnit, siegeUnit])
  const playerMoveFromObjectSpy = jest
    .spyOn(PlayerMoveResolver, 'fromObject')
    .mockResolvedValueOnce(resolvedCloseMove)
    .mockResolvedValueOnce(resolvedRangedMove)
    .mockResolvedValueOnce(resolvedSiegeMove)
    .mockResolvedValueOnce(resolvedLeaderMove)
    .mockResolvedValueOnce(resolvedCloseMove)
    .mockResolvedValueOnce(resolvedRangedMove)
    .mockResolvedValueOnce(resolvedSiegeMove)
    .mockResolvedValueOnce(resolvedLeaderMove)

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
  await expect(
    PlayerRoundResolver.fromArray({
      rounds: [round1, round2],
      leader,
    })
  ).resolves.toEqual(expected)

  expect(gameUnitsFromArraySpy.mock.calls).toEqual([
    [
      {
        gameUnits: [close.units[0], ranged.units[0], siege.units[0], close.units[0], ranged.units[0], siege.units[0]],
      },
    ],
  ])
  expect(playerMoveFromObjectSpy.mock.calls).toEqual([
    [
      {
        move: round1.moves[0],
        deckUnit: {
          artStyle: closeUnit.artStyle,
          unit: closeUnit.unit,
        },
        leader: undefined,
      },
    ],
    [
      {
        move: round1.moves[1],
        deckUnit: {
          artStyle: rangedUnit.artStyle,
          unit: rangedUnit.unit,
        },
        leader: undefined,
      },
    ],
    [
      {
        move: round1.moves[2],
        deckUnit: {
          artStyle: siegeUnit.artStyle,
          unit: siegeUnit.unit,
        },
        leader: undefined,
      },
    ],
    [
      {
        move: round1.moves[3],
        deckUnit: undefined,
        leader,
      },
    ],
    [
      {
        move: round2.moves[0],
        deckUnit: {
          artStyle: closeUnit.artStyle,
          unit: closeUnit.unit,
        },
        leader: undefined,
      },
    ],
    [
      {
        move: round2.moves[1],
        deckUnit: {
          artStyle: rangedUnit.artStyle,
          unit: rangedUnit.unit,
        },
        leader: undefined,
      },
    ],
    [
      {
        move: round2.moves[2],
        deckUnit: {
          artStyle: siegeUnit.artStyle,
          unit: siegeUnit.unit,
        },
        leader: undefined,
      },
    ],
    [
      {
        move: round2.moves[3],
        deckUnit: undefined,
        leader,
      },
    ],
  ])
}
