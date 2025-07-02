import { ObjectId } from 'mongodb'

import { Combat, Impact, Leader, Move, MoveLeader, MovePass, MoveUnit } from '@gwent/graphql-schema/resolver-typings'
import {
  GameUnit,
  MoveDbObject,
  MoveLeaderDbObject,
  MovePassDbObject,
  MoveUnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import GameUnitResolver from '../../src/graphql/resolvers/types/game-unit-resolver'
import LeaderResolver from '../../src/graphql/resolvers/types/leader-resolver'
import MoveImpactResolver from '../../src/graphql/resolvers/types/move-impact-resolver'
import { MoveType } from '@gwent/graphql-schema'
import PlayerMoveResolver from '../../src/graphql/resolvers/types/player-move-resolver'
import TestUtil from '../util/test-util'

describe('player-move-resolver', () => {
  describe('fromObject', () => {
    it('throws error if invalid move type', async () => {
      const type = 'invalid'
      await testFromObject({
        move: {
          created: new Date(),
          type: type as any as MoveType,
        },
        error: Error(`Invalid Move type "${type}".`),
      })
    })
    it('calls to resolve leader if LeaderMove and no leader provided', async () => {
      const leader = TestUtil.getLeader({})
      const move: MoveLeaderDbObject = {
        created: new Date(),
        leader: new ObjectId(leader.id),
        type: MoveType.Leader,
      }
      await testFromObject({
        move,
        leaderFromIdResponse: leader,
        expected: {
          created: move.created,
          leader,
          __typename: 'MoveLeader',
        } as MoveLeader,
      })
    })
    it('does not call to resolve leader if LeaderMove and leader provided', async () => {
      const leader = TestUtil.getLeader({})
      const move: MoveLeaderDbObject = {
        created: new Date(),
        leader: new ObjectId(leader.id),
        type: MoveType.Leader,
      }
      await testFromObject({
        move,
        leader,
        expected: {
          created: move.created,
          leader,
          __typename: 'MoveLeader',
        } as MoveLeader,
      })
    })
    it('does not call to any resolver if PassMove', async () => {
      const move: MovePassDbObject = {
        created: new Date(),
        type: MoveType.Pass,
      }
      await testFromObject({
        move,
        expected: {
          created: move.created,
          __typename: 'MovePass',
        } as MovePass,
      })
    })
    it('calls to resolve gameUnit if UnitMove and no gameUnit provided', async () => {
      const gameUnit = TestUtil.getGameUnit({
        unit: TestUtil.getUnit({}),
      })
      const move: MoveUnitDbObject = {
        created: new Date(),
        unit: TestUtil.getDbGameUnit({
          artStyle: gameUnit.artStyle,
          effectiveStrength: gameUnit.effectiveStrength,
          effects: [],
          id: new ObjectId(gameUnit.unit.id),
        }),
        type: MoveType.Unit,
      }
      await testFromObject({
        move,
        gameUnitFromObjectResponse: gameUnit,
        expected: {
          created: move.created,
          unit: gameUnit,
          impacts: [],
          __typename: 'MoveUnit',
        } as MoveUnit,
      })
    })
    it('does not call to resolve gameUnit if UnitMove and gameUnit provided', async () => {
      const gameUnit = TestUtil.getGameUnit({
        unit: TestUtil.getUnit({}),
      })
      const move: MoveUnitDbObject = {
        created: new Date(),
        unit: TestUtil.getDbGameUnit({
          artStyle: gameUnit.artStyle,
          effectiveStrength: gameUnit.effectiveStrength,
          effects: [],
          id: new ObjectId(gameUnit.unit.id),
        }),
        type: MoveType.Unit,
      }
      await testFromObject({
        move,
        gameUnit,
        expected: {
          created: move.created,
          unit: gameUnit,
          impacts: [],
          __typename: 'MoveUnit',
        } as MoveUnit,
      })
    })
    it('resolved impact if returned from MoveImpactResolver', async () => {
      const gameUnit = TestUtil.getGameUnit({
        unit: TestUtil.getUnit({}),
      })
      const impact: Impact = {
        unit: TestUtil.getGameUnit({
          unit: TestUtil.getUnit({}),
        }),
        user: TestUtil.getUser({}),
      }
      const move: MoveUnitDbObject = {
        created: new Date(),
        unit: TestUtil.getDbGameUnit({
          artStyle: gameUnit.artStyle,
          effectiveStrength: gameUnit.effectiveStrength,
          effects: [],
          id: new ObjectId(gameUnit.unit.id),
        }),
        impacts: [
          {
            unit: {
              artStyle: impact.unit.artStyle,
              unit: new ObjectId(impact.unit.unit.id),
              effectiveStrength: impact.unit.effectiveStrength,
              effects: [],
              row: Combat.Close,
            },
            user: new ObjectId(impact.user.id),
          },
        ],
        type: MoveType.Unit,
      }
      await testFromObject({
        move,
        gameUnitFromObjectResponse: gameUnit,
        impactFromArrayResponse: [impact],
        expected: {
          created: move.created,
          unit: gameUnit,
          impacts: [impact],
          __typename: 'MoveUnit',
        } as MoveUnit,
      })
    })
  })
})

async function testFromObject({
  move,
  leader,
  gameUnit,
  leaderFromIdResponse,
  gameUnitFromObjectResponse,
  impactFromArrayResponse = [],
  error,
  expected,
}: {
  move: MoveDbObject
  leader?: Leader
  gameUnit?: GameUnit
  leaderFromIdResponse?: Leader
  gameUnitFromObjectResponse?: GameUnit
  impactFromArrayResponse?: Impact[]
  error?: Error
  expected?: Move
}) {
  const leaderFromIdSpy = jest.spyOn(LeaderResolver, 'fromId')
  if (leaderFromIdResponse) {
    leaderFromIdSpy.mockResolvedValue(leaderFromIdResponse)
  }
  const gameUnitFromObjectSpy = jest.spyOn(GameUnitResolver, 'fromObject')
  if (gameUnitFromObjectResponse) {
    gameUnitFromObjectSpy.mockResolvedValue(gameUnitFromObjectResponse)
  }
  const impactFromArraySpy = jest.spyOn(MoveImpactResolver, 'fromArray').mockResolvedValue(impactFromArrayResponse)

  const promise = PlayerMoveResolver.fromObject({
    move,
    gameUnit,
    leader,
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(leaderFromIdSpy.mock.calls).toEqual(
    leaderFromIdResponse
      ? [
          [
            {
              id: (move as MoveLeaderDbObject).leader,
            },
          ],
        ]
      : []
  )
  expect(gameUnitFromObjectSpy.mock.calls).toEqual(
    gameUnitFromObjectResponse
      ? [
          [
            {
              gameUnit: (move as MoveUnitDbObject).unit,
            },
          ],
        ]
      : []
  )
  expect(impactFromArraySpy.mock.calls).toEqual(
    gameUnit || gameUnitFromObjectResponse
      ? [
          [
            {
              impacts: (move as MoveUnitDbObject).impacts,
            },
          ],
        ]
      : []
  )
}
