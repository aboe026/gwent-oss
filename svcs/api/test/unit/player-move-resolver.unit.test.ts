import { ObjectId } from 'mongodb'

import { Combat, DeckUnit, Leader, Move, MoveLeader, MovePass, MoveUnit } from '@gwent/graphql-schema/resolver-typings'
import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import LeaderResolver from '../../src/graphql/resolvers/types/leader-resolver'
import {
  MoveDbObject,
  MoveLeaderDbObject,
  MovePassDbObject,
  MoveUnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import { MoveType } from '@gwent/graphql-schema'
import PlayerMoveResolver from '../../src/graphql/resolvers/types/player-move-resolver'
import TestUtil from '../test-util'

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
    it('calls to resolve deckUnit if UnitMove and no deckUnit provided', async () => {
      const deckUnit: DeckUnit = {
        artStyle: 1,
        unit: TestUtil.getUnit({
          combats: [Combat.Close],
        }),
      }
      const move: MoveUnitDbObject = {
        created: new Date(),
        row: Combat.Close,
        unit: {
          artStyle: deckUnit.artStyle,
          unit: new ObjectId(deckUnit.unit.id),
        },
        type: MoveType.Unit,
      }
      await testFromObject({
        move,
        deckUnitFromObjectResponse: deckUnit,
        expected: {
          created: move.created,
          row: Combat.Close,
          unit: deckUnit,
          __typename: 'MoveUnit',
        } as MoveUnit,
      })
    })
    it('does not call to resolve deckUnit if UnitMove and deckUnit provided', async () => {
      const deckUnit: DeckUnit = {
        artStyle: 1,
        unit: TestUtil.getUnit({
          combats: [Combat.Close],
        }),
      }
      const move: MoveUnitDbObject = {
        created: new Date(),
        row: Combat.Close,
        unit: {
          artStyle: deckUnit.artStyle,
          unit: new ObjectId(deckUnit.unit.id),
        },
        type: MoveType.Unit,
      }
      await testFromObject({
        move,
        deckUnit,
        expected: {
          created: move.created,
          row: Combat.Close,
          unit: deckUnit,
          __typename: 'MoveUnit',
        } as MoveUnit,
      })
    })
  })
})

async function testFromObject({
  move,
  leader,
  deckUnit,
  leaderFromIdResponse,
  deckUnitFromObjectResponse,
  error,
  expected,
}: {
  move: MoveDbObject
  leader?: Leader
  deckUnit?: DeckUnit
  leaderFromIdResponse?: Leader
  deckUnitFromObjectResponse?: DeckUnit
  error?: Error
  expected?: Move
}) {
  const leaderFromIdSpy = jest.spyOn(LeaderResolver, 'fromId')
  if (leaderFromIdResponse) {
    leaderFromIdSpy.mockResolvedValue(leaderFromIdResponse)
  }
  const deckUnitFromObjectSpy = jest.spyOn(DeckUnitResolver, 'fromObject')
  if (deckUnitFromObjectResponse) {
    deckUnitFromObjectSpy.mockResolvedValue(deckUnitFromObjectResponse)
  }

  const promise = PlayerMoveResolver.fromObject({
    move,
    deckUnit,
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
  expect(deckUnitFromObjectSpy.mock.calls).toEqual(
    deckUnitFromObjectResponse
      ? [
          [
            {
              deckUnit: (move as MoveUnitDbObject).unit,
            },
          ],
        ]
      : []
  )
}
