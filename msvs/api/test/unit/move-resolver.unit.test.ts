import { ObjectId } from 'mongodb'

import {
  Combat,
  DeckUnit,
  Impact,
  Leader,
  Move,
  MoveLeader,
  MovePass,
  MoveUnit,
  User,
} from '@gwent/graphql-schema/resolver-typings'
import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import {
  GameUnit,
  GameUnitOrigin,
  MoveDbObject,
  MoveLeaderDbObject,
  MovePassDbObject,
  MoveReasonType,
  MoveUnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import GameUnitResolver from '../../src/graphql/resolvers/types/game-unit-resolver'
import ImpactResolver from '../../src/graphql/resolvers/types/impact-resolver'
import LeaderResolver from '../../src/graphql/resolvers/types/leader-resolver'
import MoveResolver from '../../src/graphql/resolvers/types/move-resolver'
import { MoveType } from '@gwent/graphql-schema'
import TestUtil from '../util/test-util'
import UserResolver from '../../src/graphql/resolvers/types/user-resolver'

describe('move-resolver', () => {
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
    it('calls to resolve inputs if inputs not provided', async () => {
      const gameUnit = TestUtil.getGameUnit({
        unit: TestUtil.getUnit({}),
      })
      const reasonUnit = TestUtil.getDeckUnit({})
      const sourceUser = TestUtil.getUser({})
      const move: MoveUnitDbObject = {
        created: new Date(),
        unit: TestUtil.getDbGameUnit({
          artStyle: gameUnit.artStyle,
          effectiveStrength: gameUnit.effectiveStrength,
          effects: [],
          id: new ObjectId(gameUnit.unit.id),
        }),
        type: MoveType.Unit,
        reason: {
          type: MoveReasonType.Deploy,
          unit: TestUtil.getDbDeckUnit({
            artStyle: reasonUnit.artStyle,
            id: reasonUnit.unit.id,
          }),
        },
        source: {
          origin: GameUnitOrigin.Hand,
          user: new ObjectId(sourceUser.id),
        },
      }
      await testFromObject({
        move,
        gameUnitFromObjectResponse: gameUnit,
        deckUnitFromObjectResponse: reasonUnit,
        userFromIdResponse: sourceUser,
        expected: {
          created: move.created,
          unit: gameUnit,
          impacts: [],
          __typename: 'MoveUnit',
          reason: {
            type: MoveReasonType.Deploy,
            unit: reasonUnit,
          },
          source: {
            origin: GameUnitOrigin.Hand,
            user: sourceUser,
          },
        } as MoveUnit,
      })
    })
    it('does not call to resolve inputs if inputs provided', async () => {
      const gameUnit = TestUtil.getGameUnit({
        unit: TestUtil.getUnit({}),
      })
      const reasonUnit = TestUtil.getDeckUnit({})
      const sourceUser = TestUtil.getUser({})
      const move: MoveUnitDbObject = {
        created: new Date(),
        unit: TestUtil.getDbGameUnit({
          artStyle: gameUnit.artStyle,
          effectiveStrength: gameUnit.effectiveStrength,
          effects: [],
          id: new ObjectId(gameUnit.unit.id),
        }),
        type: MoveType.Unit,
        reason: {
          type: MoveReasonType.Deploy,
          unit: TestUtil.getDbDeckUnit({
            artStyle: reasonUnit.artStyle,
            id: reasonUnit.unit.id,
          }),
        },
        source: {
          origin: GameUnitOrigin.Hand,
          user: new ObjectId(sourceUser.id),
        },
      }
      await testFromObject({
        move,
        gameUnit,
        reasonUnit,
        sourceUser,
        expected: {
          created: move.created,
          unit: gameUnit,
          impacts: [],
          reason: {
            type: MoveReasonType.Deploy,
            unit: reasonUnit,
          },
          source: {
            origin: GameUnitOrigin.Hand,
            user: sourceUser,
          },
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
        reason: {
          type: MoveReasonType.Deploy,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
      }
      await testFromObject({
        move,
        gameUnitFromObjectResponse: gameUnit,
        impactFromArrayResponse: [impact],
        expected: {
          created: move.created,
          unit: gameUnit,
          impacts: [impact],
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
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
  reasonUnit,
  sourceUser,
  leaderFromIdResponse,
  gameUnitFromObjectResponse,
  impactFromArrayResponse = [],
  deckUnitFromObjectResponse,
  userFromIdResponse,
  error,
  expected,
}: {
  move: MoveDbObject
  leader?: Leader
  gameUnit?: GameUnit
  reasonUnit?: DeckUnit
  sourceUser?: User
  leaderFromIdResponse?: Leader
  gameUnitFromObjectResponse?: GameUnit
  impactFromArrayResponse?: Impact[]
  deckUnitFromObjectResponse?: DeckUnit
  userFromIdResponse?: User
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
  const impactFromArraySpy = jest.spyOn(ImpactResolver, 'fromArray').mockResolvedValue(impactFromArrayResponse)
  const deckUnitFromObjectSpy = jest.spyOn(DeckUnitResolver, 'fromObject')
  if (deckUnitFromObjectResponse) {
    deckUnitFromObjectSpy.mockResolvedValue(deckUnitFromObjectResponse)
  }
  const userFromIdSpy = jest.spyOn(UserResolver, 'fromId')
  if (userFromIdResponse) {
    userFromIdSpy.mockResolvedValue(userFromIdResponse)
  }

  const promise = MoveResolver.fromObject({
    move,
    gameUnit,
    leader,
    reasonUnit,
    sourceUser,
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
  expect(deckUnitFromObjectSpy.mock.calls).toEqual(
    deckUnitFromObjectResponse
      ? [
          [
            {
              deckUnit: (move as MoveUnitDbObject).reason.unit,
            },
          ],
        ]
      : []
  )
  expect(userFromIdSpy.mock.calls).toEqual(userFromIdResponse ? [[(move as MoveUnitDbObject).source.user]] : [])
}
