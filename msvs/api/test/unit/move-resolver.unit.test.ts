import { ObjectId } from 'mongodb'

import {
  DeckUnit,
  FieldUnit,
  Impact,
  Leader,
  Move,
  MoveLeader,
  MovePass,
  Unit,
  User,
} from '@gwent/graphql-schema/resolver-typings'
import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import FieldUnitResolver from '../../src/graphql/resolvers/types/field-unit-resolver'
import {
  GameUnitOrigin,
  MoveDbObject,
  MoveLeaderDbObject,
  MovePassDbObject,
  MoveReasonType,
  MoveUnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import ImpactResolver from '../../src/graphql/resolvers/types/impact-resolver'
import LeaderResolver from '../../src/graphql/resolvers/types/leader-resolver'
import MoveResolver from '../../src/graphql/resolvers/types/move-resolver'
import { MoveType } from '@gwent/graphql-schema'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

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
    describe('leader', () => {
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
    })
    describe('pass', () => {
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
    })
    describe('unit', () => {
      it('throws error if unit for move not found', async () => {
        const fieldUnit = TestUtil.getFieldUnit({
          unit: TestUtil.getUnit({}),
        })
        const move: MoveUnitDbObject = {
          created: new Date(),
          unit: TestUtil.getDbGameUnit({
            artStyle: fieldUnit.artStyle,
            effectiveStrength: fieldUnit.effectiveStrength,
            id: new ObjectId(fieldUnit.unit.id),
          }),
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
          error: Error(`Could not find move unit "${fieldUnit.unit.id}"`),
        })
      })
      it('throws error if unit for reason not found', async () => {
        const fieldUnit = TestUtil.getFieldUnit({
          unit: TestUtil.getUnit({}),
        })
        const deckUnit = TestUtil.getDbDeckUnit({})
        const move: MoveUnitDbObject = {
          created: new Date(),
          unit: TestUtil.getDbGameUnit({
            artStyle: fieldUnit.artStyle,
            effectiveStrength: fieldUnit.effectiveStrength,
            id: new ObjectId(fieldUnit.unit.id),
          }),
          type: MoveType.Unit,
          reason: {
            type: MoveReasonType.Deploy,
            unit: TestUtil.convertDeckDbUnitToGameDbUnit(deckUnit),
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }
        await testFromObject({
          move,
          resolvedUnits: [
            TestUtil.getUnit({
              id: fieldUnit.unit.id,
            }),
          ],
          error: Error(`Could not find reason unit "${deckUnit.unit}"`),
        })
      })
      it('throws error if source user not found', async () => {
        const fieldUnit = TestUtil.getFieldUnit({
          unit: TestUtil.getUnit({}),
        })
        const userId = new ObjectId()
        const move: MoveUnitDbObject = {
          created: new Date(),
          unit: TestUtil.getDbGameUnit({
            artStyle: fieldUnit.artStyle,
            effectiveStrength: fieldUnit.effectiveStrength,
            id: new ObjectId(fieldUnit.unit.id),
          }),
          type: MoveType.Unit,
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
            user: userId,
          },
        }
        await testFromObject({
          move,
          resolvedUnits: [
            TestUtil.getUnit({
              id: fieldUnit.unit.id,
            }),
          ],
          error: Error(`Could not find source user "${userId}"`),
        })
      })
      it('throws error if target user not found', async () => {
        const fieldUnit = TestUtil.getFieldUnit({
          unit: TestUtil.getUnit({}),
        })
        const userId = new ObjectId()
        const move: MoveUnitDbObject = {
          created: new Date(),
          unit: TestUtil.getDbGameUnit({
            artStyle: fieldUnit.artStyle,
            effectiveStrength: fieldUnit.effectiveStrength,
            id: new ObjectId(fieldUnit.unit.id),
          }),
          type: MoveType.Unit,
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
          target: userId,
        }
        await testFromObject({
          move,
          resolvedUnits: [
            TestUtil.getUnit({
              id: fieldUnit.unit.id,
            }),
          ],
          error: Error(`Could not find target user "${userId}"`),
        })
      })
      it('resolves with no reason or source', async () => {
        const fieldUnit = TestUtil.getFieldUnit({
          unit: TestUtil.getUnit({}),
        })
        const move: MoveUnitDbObject = {
          created: new Date(),
          unit: TestUtil.getDbGameUnit({
            artStyle: fieldUnit.artStyle,
            effectiveStrength: fieldUnit.effectiveStrength,
            id: new ObjectId(fieldUnit.unit.id),
          }),
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
          resolvedUnits: [
            TestUtil.getUnit({
              id: fieldUnit.unit.id,
            }),
          ],
          fieldUnitFromObjectResponse: fieldUnit,
          expected: {
            created: move.created,
            unit: fieldUnit,
            impacts: [],
            reason: {
              type: MoveReasonType.Deploy,
              unit: undefined,
            },
            source: {
              origin: GameUnitOrigin.Hand,
              user: undefined,
            },
            __typename: 'MoveUnit',
          },
        })
      })
      it('resolves with reason source and target without prefetches', async () => {
        const fieldUnit = TestUtil.getFieldUnit({
          unit: TestUtil.getUnit({}),
        })
        const deckUnit = TestUtil.getDbDeckUnit({})
        const reasonUnit = TestUtil.getUnit({
          id: deckUnit.unit,
        })
        const resolvedReasonUnit = TestUtil.getDeckUnitFromDbDeckUnit({
          deckUnit,
          unit: reasonUnit,
        })
        const sourceUser = TestUtil.getUser({})
        const targetUser = TestUtil.getUser({})
        const move: MoveUnitDbObject = {
          created: new Date(),
          unit: TestUtil.getDbGameUnit({
            artStyle: fieldUnit.artStyle,
            effectiveStrength: fieldUnit.effectiveStrength,
            id: new ObjectId(fieldUnit.unit.id),
          }),
          type: MoveType.Unit,
          reason: {
            type: MoveReasonType.Deploy,
            unit: TestUtil.convertDeckDbUnitToGameDbUnit(deckUnit),
          },
          source: {
            origin: GameUnitOrigin.Hand,
            user: new ObjectId(sourceUser.id),
          },
          target: new ObjectId(targetUser.id),
        }
        await testFromObject({
          move,
          resolvedUnits: [
            TestUtil.getUnit({
              id: fieldUnit.unit.id,
            }),
            reasonUnit,
          ],
          resolvedUsers: [sourceUser, targetUser],
          fieldUnitFromObjectResponse: fieldUnit,
          deckUnitFromObjectResponse: resolvedReasonUnit,
          expected: {
            created: move.created,
            unit: fieldUnit,
            impacts: [],
            reason: {
              type: MoveReasonType.Deploy,
              unit: resolvedReasonUnit,
            },
            source: {
              origin: GameUnitOrigin.Hand,
              user: sourceUser,
            },
            target: targetUser,
            __typename: 'MoveUnit',
          },
        })
      })
      it('resolves with reason source and target with prefetches', async () => {
        const fieldUnit = TestUtil.getFieldUnit({
          unit: TestUtil.getUnit({}),
        })
        const deckUnit = TestUtil.getDbDeckUnit({})
        const reasonUnit = TestUtil.getUnit({
          id: deckUnit.unit,
        })
        const resolvedReasonUnit = TestUtil.getDeckUnitFromDbDeckUnit({
          deckUnit,
          unit: reasonUnit,
        })
        const sourceUser = TestUtil.getUser({})
        const targetUser = TestUtil.getUser({})
        const move: MoveUnitDbObject = {
          created: new Date(),
          unit: TestUtil.getDbGameUnit({
            artStyle: fieldUnit.artStyle,
            effectiveStrength: fieldUnit.effectiveStrength,
            id: new ObjectId(fieldUnit.unit.id),
          }),
          type: MoveType.Unit,
          reason: {
            type: MoveReasonType.Deploy,
            unit: TestUtil.convertDeckDbUnitToGameDbUnit(deckUnit),
          },
          source: {
            origin: GameUnitOrigin.Hand,
            user: new ObjectId(sourceUser.id),
          },
          target: new ObjectId(targetUser.id),
        }
        await testFromObject({
          move,
          units: [
            TestUtil.getUnit({
              id: fieldUnit.unit.id,
            }),
            reasonUnit,
          ],
          users: [sourceUser, targetUser],
          fieldUnitFromObjectResponse: fieldUnit,
          deckUnitFromObjectResponse: resolvedReasonUnit,
          expected: {
            created: move.created,
            unit: fieldUnit,
            impacts: [],
            reason: {
              type: MoveReasonType.Deploy,
              unit: resolvedReasonUnit,
            },
            source: {
              origin: GameUnitOrigin.Hand,
              user: sourceUser,
            },
            target: targetUser,
            __typename: 'MoveUnit',
          },
        })
      })
    })
  })
  describe('fromArray', () => {
    it('throws error if leader not found', async () => {
      const fieldUnits = [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})]
      const userId = new ObjectId()
      const leaderId = new ObjectId()
      const unitMove1 = TestUtil.getDbMove({
        type: MoveType.Unit,
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnits[0]),
        reason: {
          type: MoveReasonType.Deploy,
          unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnits[1]),
        },
        source: {
          origin: GameUnitOrigin.Hand,
          user: userId,
        },
      })
      const unitMove2 = TestUtil.getDbMove({
        type: MoveType.Unit,
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnits[0]),
        reason: {
          type: MoveReasonType.Deploy,
          unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnits[1]),
        },
        source: {
          origin: GameUnitOrigin.Hand,
          user: userId,
        },
      })
      const unitMove3 = TestUtil.getDbMove({
        type: MoveType.Unit,
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnits[0]),
        reason: {
          type: MoveReasonType.Deploy,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
      })
      const leaderMove1 = TestUtil.getDbMove({
        type: MoveType.Leader,
        leaderId,
      })
      const leaderMove2 = TestUtil.getDbMove({
        type: MoveType.Leader,
        leaderId,
      })
      const resolvedUnits = [
        TestUtil.getUnit({
          id: fieldUnits[0].unit,
        }),
        TestUtil.getUnit({
          id: fieldUnits[1].unit,
        }),
      ]
      const resolvedUsers = [
        TestUtil.getUser({
          id: userId,
        }),
      ]
      const message = `Could not find move leader "${leaderId}"`
      await testFromArray({
        moves: [unitMove1, unitMove2, unitMove3, leaderMove1, leaderMove2],
        resolvedUnits,
        resolvedUsers,
        error: Error(`${message}.`),
        leadersFromIdsCalls: [
          [
            {
              ids: [leaderId.toString()],
            },
          ],
        ],
        moveFromObjectCalls: [
          [
            {
              move: unitMove1,
              leader: undefined,
              units: resolvedUnits,
              users: resolvedUsers,
            },
          ],
          [
            {
              move: unitMove2,
              leader: undefined,
              units: resolvedUnits,
              users: resolvedUsers,
            },
          ],
          [
            {
              move: unitMove3,
              leader: undefined,
              units: resolvedUnits,
              users: resolvedUsers,
            },
          ],
        ],
        errorCalls: [[`${message}, move: "${JSON.stringify(leaderMove1)}"`]],
      })
    })
    it('returns empty array if given one', async () => {
      await testFromArray({
        moves: [],
      })
    })
    it('returns moves without optional inputs', async () => {
      const fieldUnits = [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})]
      const userId = new ObjectId()
      const leaderId = new ObjectId()
      const unitMove1 = TestUtil.getDbMove({
        type: MoveType.Unit,
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnits[0]),
        reason: {
          type: MoveReasonType.Deploy,
          unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnits[1]),
        },
        source: {
          origin: GameUnitOrigin.Hand,
          user: userId,
        },
      })
      const unitMove2 = TestUtil.getDbMove({
        type: MoveType.Unit,
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnits[0]),
        reason: {
          type: MoveReasonType.Deploy,
          unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnits[1]),
        },
        source: {
          origin: GameUnitOrigin.Hand,
          user: userId,
        },
      })
      const unitMove3 = TestUtil.getDbMove({
        type: MoveType.Unit,
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnits[0]),
        reason: {
          type: MoveReasonType.Deploy,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
      })
      const leaderMove1 = TestUtil.getDbMove({
        type: MoveType.Leader,
        leaderId,
      })
      const leaderMove2 = TestUtil.getDbMove({
        type: MoveType.Leader,
        leaderId,
      })
      const resolvedUnits = [
        TestUtil.getUnit({
          id: fieldUnits[0].unit,
        }),
        TestUtil.getUnit({
          id: fieldUnits[1].unit,
        }),
      ]
      const resolvedUsers = [
        TestUtil.getUser({
          id: userId,
        }),
      ]
      const resolvedLeaders = [
        TestUtil.getLeader({
          id: leaderId,
        }),
      ]
      await testFromArray({
        moves: [unitMove1, unitMove2, unitMove3, leaderMove1, leaderMove2],
        resolvedUnits,
        resolvedUsers,
        resolvedLeaders,
        leadersFromIdsCalls: [
          [
            {
              ids: [leaderId.toString()],
            },
          ],
        ],
        moveFromObjectCalls: [
          [
            {
              move: unitMove1,
              leader: undefined,
              units: resolvedUnits,
              users: resolvedUsers,
            },
          ],
          [
            {
              move: unitMove2,
              leader: undefined,
              units: resolvedUnits,
              users: resolvedUsers,
            },
          ],
          [
            {
              move: unitMove3,
              leader: undefined,
              units: resolvedUnits,
              users: resolvedUsers,
            },
          ],
          [
            {
              move: leaderMove1,
              leader: resolvedLeaders[0],
              units: resolvedUnits,
              users: resolvedUsers,
            },
          ],
          [
            {
              move: leaderMove1,
              leader: resolvedLeaders[0],
              units: resolvedUnits,
              users: resolvedUsers,
            },
          ],
        ],
      })
    })
    it('returns moves with optional inputs', async () => {
      const fieldUnits = [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})]
      const userId = new ObjectId()
      const leaderId = new ObjectId()
      const unitMove1 = TestUtil.getDbMove({
        type: MoveType.Unit,
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnits[0]),
        reason: {
          type: MoveReasonType.Deploy,
          unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnits[1]),
        },
        source: {
          origin: GameUnitOrigin.Hand,
          user: userId,
        },
      })
      const unitMove2 = TestUtil.getDbMove({
        type: MoveType.Unit,
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnits[0]),
        reason: {
          type: MoveReasonType.Deploy,
          unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnits[1]),
        },
        source: {
          origin: GameUnitOrigin.Hand,
          user: userId,
        },
      })
      const unitMove3 = TestUtil.getDbMove({
        type: MoveType.Unit,
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnits[0]),
        reason: {
          type: MoveReasonType.Deploy,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
      })
      const leaderMove1 = TestUtil.getDbMove({
        type: MoveType.Leader,
        leaderId,
      })
      const leaderMove2 = TestUtil.getDbMove({
        type: MoveType.Leader,
        leaderId,
      })
      const resolvedUnits = [
        TestUtil.getUnit({
          id: fieldUnits[0].unit,
        }),
        TestUtil.getUnit({
          id: fieldUnits[1].unit,
        }),
      ]
      const resolvedUsers = [
        TestUtil.getUser({
          id: userId,
        }),
      ]
      const resolvedLeaders = [
        TestUtil.getLeader({
          id: leaderId,
        }),
      ]
      await testFromArray({
        moves: [unitMove1, unitMove2, unitMove3, leaderMove1, leaderMove2],
        units: resolvedUnits,
        users: resolvedUsers,
        resolvedLeaders,
        leadersFromIdsCalls: [
          [
            {
              ids: [leaderId.toString()],
            },
          ],
        ],
        moveFromObjectCalls: [
          [
            {
              move: unitMove1,
              leader: undefined,
              units: resolvedUnits,
              users: resolvedUsers,
            },
          ],
          [
            {
              move: unitMove2,
              leader: undefined,
              units: resolvedUnits,
              users: resolvedUsers,
            },
          ],
          [
            {
              move: unitMove3,
              leader: undefined,
              units: resolvedUnits,
              users: resolvedUsers,
            },
          ],
          [
            {
              move: leaderMove1,
              leader: resolvedLeaders[0],
              units: resolvedUnits,
              users: resolvedUsers,
            },
          ],
          [
            {
              move: leaderMove2,
              leader: resolvedLeaders[0],
              units: resolvedUnits,
              users: resolvedUsers,
            },
          ],
        ],
      })
    })
  })
})

async function testFromObject({
  move,
  leader,
  units,
  users,
  resolvedUnits = [],
  resolvedUsers = [],
  leaderFromIdResponse,
  fieldUnitFromObjectResponse,
  impactFromArrayResponse = [],
  deckUnitFromObjectResponse,
  error,
  expected,
}: {
  move: MoveDbObject
  leader?: Leader
  units?: Unit[]
  users?: User[]
  resolvedUnits?: Unit[]
  resolvedUsers?: User[]
  leaderFromIdResponse?: Leader
  fieldUnitFromObjectResponse?: FieldUnit
  impactFromArrayResponse?: Impact[]
  deckUnitFromObjectResponse?: DeckUnit
  error?: Error
  expected?: Move
}) {
  const leaderFromIdSpy = jest.spyOn(LeaderResolver, 'fromId')
  if (leaderFromIdResponse) {
    leaderFromIdSpy.mockResolvedValue(leaderFromIdResponse)
  }
  const fieldUnitFromObjectSpy = jest.spyOn(FieldUnitResolver, 'fromObject')
  if (fieldUnitFromObjectResponse) {
    fieldUnitFromObjectSpy.mockResolvedValue(fieldUnitFromObjectResponse)
  }
  const impactFromArraySpy = jest.spyOn(ImpactResolver, 'fromArray').mockResolvedValue(impactFromArrayResponse)
  const deckUnitFromObjectSpy = jest.spyOn(DeckUnitResolver, 'fromObject')
  if (deckUnitFromObjectResponse) {
    deckUnitFromObjectSpy.mockResolvedValue(deckUnitFromObjectResponse)
  }
  const resolveUsersAndUnitsSpy = jest.spyOn(ResolverUtil, 'resolveUsersAndUnits').mockResolvedValue({
    units: units || resolvedUnits,
    users: users || resolvedUsers,
  })

  const promise = MoveResolver.fromObject({
    move,
    leader,
    units,
    users,
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
  expect(resolveUsersAndUnitsSpy.mock.calls).toEqual(
    move.type === MoveType.Unit
      ? [
          [
            {
              moves: [move],
              presolvedUnits: units,
              presolvedUsers: users,
            },
          ],
        ]
      : []
  )
  expect(fieldUnitFromObjectSpy.mock.calls).toEqual(
    fieldUnitFromObjectResponse
      ? [
          [
            {
              fieldUnit: (move as MoveUnitDbObject).unit,
              unit: (units || resolvedUnits)[0],
            },
          ],
        ]
      : []
  )
  expect(impactFromArraySpy.mock.calls).toEqual(
    fieldUnitFromObjectResponse
      ? [
          [
            {
              impacts: (move as MoveUnitDbObject).impacts,
              units: units || resolvedUnits,
              users: users || resolvedUsers,
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
              unit: (units || resolvedUnits)[1],
            },
          ],
        ]
      : []
  )
}

async function testFromArray({
  moves,
  units,
  users,
  resolvedUnits = [],
  resolvedUsers = [],
  resolvedLeaders = [],
  error,
  leadersFromIdsCalls = [],
  moveFromObjectCalls = [],
  errorCalls = [],
}: {
  moves: MoveDbObject[]
  units?: Unit[]
  users?: User[]
  resolvedUnits?: Unit[]
  resolvedUsers?: User[]
  resolvedLeaders?: Leader[]
  error?: Error
  leadersFromIdsCalls?: any[][]
  moveFromObjectCalls?: any[][]
  errorCalls?: string[][]
}) {
  const resolveUsersAndUnitsSpy = jest.spyOn(ResolverUtil, 'resolveUsersAndUnits').mockResolvedValue({
    units: units || resolvedUnits,
    users: users || resolvedUsers,
  })
  const leadersFromIdsSpy = jest.spyOn(LeaderResolver, 'fromIds').mockResolvedValue(resolvedLeaders)
  const moveFromObjectSpy = jest.spyOn(MoveResolver, 'fromObject')
  const resolvedMoves: Move[] = []
  for (const move of moves) {
    const resolvedMove: Move = {
      created: move.created,
      unit: TestUtil.getFieldUnit({
        unit: TestUtil.getUnit({}),
      }),
      reason: {
        type: MoveReasonType.Deploy,
      },
      source: {
        origin: GameUnitOrigin.Hand,
      },
    }
    moveFromObjectSpy.mockResolvedValueOnce(resolvedMove)
    resolvedMoves.push(resolvedMove)
  }
  const errorSpy = jest.fn().mockImplementation()
  MoveResolver['logger'] = {
    error: errorSpy,
  } as any

  const promise = MoveResolver.fromArray({
    moves,
    units,
    users,
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(resolvedMoves)
  }

  expect(resolveUsersAndUnitsSpy.mock.calls).toEqual(
    moves.length === 0
      ? []
      : [
          [
            {
              moves,
              presolvedUnits: units,
              presolvedUsers: users,
            },
          ],
        ]
  )
  expect(leadersFromIdsSpy.mock.calls).toEqual(leadersFromIdsCalls)
  expect(moveFromObjectSpy.mock.calls).toEqual(moveFromObjectCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
