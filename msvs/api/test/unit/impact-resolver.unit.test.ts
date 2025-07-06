import { ObjectId } from 'mongodb'

import { Combat, GameUnit, Impact, Unit, User } from '@gwent/graphql-schema/resolver-typings'
import GameUnitResolver from '../../src/graphql/resolvers/types/game-unit-resolver'
import { ImpactDbObject } from '@gwent/graphql-schema/database-typings'
import ImpactResolver from '../../src/graphql/resolvers/types/impact-resolver'
import TestUtil from '../util/test-util'
import UnitResolver from '../../src/graphql/resolvers/types/unit-resolver'
import UserResolver from '../../src/graphql/resolvers/types/user-resolver'

describe('impact-resolver', () => {
  describe('fromObject', () => {
    it('reaches out to resolve GameUnit and User if not provided', async () => {
      await testFromObject({
        impact: {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      })
    })
    it('does not reach out to resolve GameUnit and User if provided', async () => {
      const gameUnit = TestUtil.getDbGameUnit({})
      const user = TestUtil.getDbUser({})
      await testFromObject({
        impact: {
          unit: gameUnit,
          user: user._id,
        },
        gameUnit: {
          artStyle: gameUnit.artStyle,
          unit: TestUtil.getUnit({
            id: gameUnit.unit,
          }),
          effectiveStrength: gameUnit.effectiveStrength,
          effects: [],
          row: gameUnit.row ? (gameUnit.row as Combat) : undefined,
        },
        user: TestUtil.getUserFromDbUser(user),
      })
    })
  })
  describe('fromArray', () => {
    it('returns undefined if given undefined', async () => {
      await testFromArray({
        impacts: undefined,
        expected: undefined,
      })
    })
    it('returns empty array if given empty array', async () => {
      await testFromArray({
        impacts: [],
        expected: [],
      })
    })
    it('throws error if unit not found', async () => {
      const gameUnit = TestUtil.getDbGameUnit({})
      const message = `Could not find unit with ID "${gameUnit.unit}" for move Impact`
      const impact = {
        unit: gameUnit,
        user: new ObjectId(),
      }
      await testFromArray({
        impacts: [impact],
        resolvedUnits: [],
        resolvedUsers: [],
        expected: new Error(`${message}.`),
        errorCalls: [[`${message}, impact: "${JSON.stringify(impact)}"`]],
      })
    })
    it('throws error if more than 1 unit found', async () => {
      const gameUnit = TestUtil.getDbGameUnit({})
      const message = `Found more than 1 unit with ID "${gameUnit.unit}" for move Impact`
      const impact = {
        unit: gameUnit,
        user: new ObjectId(),
      }
      const matchingUnits = [
        TestUtil.getUnit({
          id: gameUnit.unit,
        }),
        TestUtil.getUnit({
          id: gameUnit.unit,
        }),
      ]
      await testFromArray({
        impacts: [impact],
        resolvedUnits: matchingUnits,
        resolvedUsers: [],
        expected: new Error(`${message}.`),
        errorCalls: [
          [`${message}, impact: "${JSON.stringify(impact)}", matchingUnits "${JSON.stringify(matchingUnits)}"`],
        ],
      })
    })
    it('throws error if user not found', async () => {
      const gameUnit = TestUtil.getDbGameUnit({})
      const impact = {
        unit: gameUnit,
        user: new ObjectId(),
      }
      const message = `Could not find user with ID "${impact.user}" for move Impact`
      await testFromArray({
        impacts: [impact],
        resolvedUnits: [
          TestUtil.getUnit({
            id: gameUnit.unit,
          }),
        ],
        resolvedUsers: [],
        expected: new Error(`${message}.`),
        errorCalls: [[`${message}, impact: "${JSON.stringify(impact)}"`]],
      })
    })
    it('throws error if more than 1 user found', async () => {
      const gameUnit = TestUtil.getDbGameUnit({})
      const impact = {
        unit: gameUnit,
        user: new ObjectId(),
      }
      const message = `Found more than 1 user with ID "${impact.user}" for move Impact`
      const matchingUsers = [
        TestUtil.getUser({
          id: impact.user,
        }),
        TestUtil.getUser({
          id: impact.user,
        }),
      ]
      await testFromArray({
        impacts: [impact],
        resolvedUnits: [
          TestUtil.getUnit({
            id: gameUnit.unit,
          }),
        ],
        resolvedUsers: matchingUsers,
        expected: new Error(`${message}.`),
        errorCalls: [
          [`${message}, impact: "${JSON.stringify(impact)}", matchingUsers: "${JSON.stringify(matchingUsers)}"`],
        ],
      })
    })
    it('returns single impact if no errors', async () => {
      const impact = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const gameUnit = TestUtil.getGameUnit({
        unit: TestUtil.getUnit({
          id: impact.unit.unit,
          strength: undefined,
        }),
        artStyle: impact.unit.artStyle,
        effectiveStrength: impact.unit.effectiveStrength || undefined,
        effects: [],
      })
      const user = TestUtil.getUser({
        id: impact.user,
      })
      await testFromArray({
        impacts: [impact],
        resolvedUnits: [gameUnit.unit],
        resolvedUsers: [user],
        expected: [
          {
            unit: gameUnit,
            user,
          },
        ],
      })
    })
    it('returns multiple impacts if no errors', async () => {
      const impact1 = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const impact2 = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const gameUnit1 = TestUtil.getGameUnit({
        unit: TestUtil.getUnit({
          id: impact1.unit.unit,
          strength: undefined,
        }),
        artStyle: impact1.unit.artStyle,
        effectiveStrength: impact1.unit.effectiveStrength || undefined,
        effects: [],
      })
      const user1 = TestUtil.getUser({
        id: impact1.user,
      })
      const gameUnit2 = TestUtil.getGameUnit({
        unit: TestUtil.getUnit({
          id: impact2.unit.unit,
          strength: undefined,
        }),
        artStyle: impact2.unit.artStyle,
        effectiveStrength: impact2.unit.effectiveStrength || undefined,
        effects: [],
      })
      const user2 = TestUtil.getUser({
        id: impact2.user,
      })
      await testFromArray({
        impacts: [impact1, impact2],
        resolvedUnits: [gameUnit1.unit, gameUnit2.unit],
        resolvedUsers: [user1, user2],
        expected: [
          {
            unit: gameUnit1,
            user: user1,
          },
          {
            unit: gameUnit2,
            user: user2,
          },
        ],
      })
    })
    it('logs to trace if enabled', async () => {
      const impact = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const gameUnit = TestUtil.getGameUnit({
        unit: TestUtil.getUnit({
          id: impact.unit.unit,
          strength: undefined,
        }),
        artStyle: impact.unit.artStyle,
        effectiveStrength: impact.unit.effectiveStrength || undefined,
        effects: [],
      })
      const user = TestUtil.getUser({
        id: impact.user,
      })
      await testFromArray({
        impacts: [impact],
        resolvedUnits: [gameUnit.unit],
        resolvedUsers: [user],
        expected: [
          {
            unit: gameUnit,
            user,
          },
        ],
        traceEnabled: true,
      })
    })
  })
})

async function testFromObject({
  impact,
  gameUnit,
  user,
}: {
  impact: ImpactDbObject
  gameUnit?: GameUnit
  user?: User
}) {
  const resolvedGameUnit = TestUtil.getGameUnit({
    unit: TestUtil.getUnit({
      id: impact.unit.unit,
    }),
    effectiveStrength: impact.unit.effectiveStrength ? impact.unit.effectiveStrength : undefined,
    artStyle: impact.unit.artStyle,
    effects: [],
  })
  const resolvedUser = TestUtil.getUser({
    id: impact.user,
  })
  const resolvedImpact: Impact = {
    unit: gameUnit || resolvedGameUnit,
    user: user || resolvedUser,
  }

  const gameUnitResolverSpy = jest.spyOn(GameUnitResolver, 'fromObject').mockResolvedValue(resolvedGameUnit)
  const userResolverSpy = jest.spyOn(UserResolver, 'fromId').mockResolvedValue(resolvedUser)

  await expect(
    ImpactResolver.fromObject({
      impact,
      gameUnit,
      user,
    })
  ).resolves.toEqual(resolvedImpact)

  expect(gameUnitResolverSpy.mock.calls).toEqual(
    gameUnit
      ? []
      : [
          [
            {
              gameUnit: impact.unit,
            },
          ],
        ]
  )
  expect(userResolverSpy.mock.calls).toEqual(user ? [] : [[impact.user]])
}

async function testFromArray({
  impacts,
  resolvedUnits,
  resolvedUsers,
  expected,
  errorCalls = [],
  traceEnabled,
}: {
  impacts: ImpactDbObject[] | undefined
  resolvedUnits?: Unit[]
  resolvedUsers?: User[]
  expected: Impact[] | Error | undefined
  errorCalls?: string[][]
  traceEnabled?: boolean
}) {
  const resolveUnitsSpy = jest.spyOn(UnitResolver, 'fromIds')
  if (resolvedUnits) {
    resolveUnitsSpy.mockResolvedValue(resolvedUnits)
  }
  const resolveUsersSpy = jest.spyOn(UserResolver, 'fromIds')
  if (resolvedUsers) {
    resolveUsersSpy.mockResolvedValue(resolvedUsers)
  }
  const gameUnitResolverSpy = jest.spyOn(GameUnitResolver, 'fromObject')
  if (!(expected instanceof Error) && impacts && resolvedUnits && resolvedUsers) {
    for (let i = 0; i < impacts.length; i++) {
      gameUnitResolverSpy.mockResolvedValueOnce(
        TestUtil.getGameUnit({
          unit: resolvedUnits[i],
          artStyle: impacts[i].unit.artStyle,
          effectiveStrength: impacts[i].unit.effectiveStrength || undefined,
          effects: [],
          row: impacts[i].unit.row ? (impacts[i].unit.row as Combat) : undefined,
        })
      )
    }
  }
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  ImpactResolver['logger'] = {
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = ImpactResolver.fromArray({
    impacts,
  })
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(errorSpy.mock.calls).toEqual(errorCalls)
  const traceCalls: string[][] = []
  if (impacts && resolvedUnits && resolvedUsers)
    for (let i = 0; i < impacts.length; i++) {
      traceCalls.push(
        ...[
          [`impact: "${JSON.stringify(impacts[i])}"`],
          [`matchingUnits: "${JSON.stringify([resolvedUnits[i]])}"`],
          [`matchingUsers: "${JSON.stringify([resolvedUsers[i]])}"`],
        ]
      )
    }
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`impacts: "${JSON.stringify(impacts)}"`],
          [`units: "${JSON.stringify(resolvedUnits)}"`],
          [`users: "${JSON.stringify(resolvedUsers)}"`],
          ...traceCalls,
          [`resolvedImpacts: "${JSON.stringify(expected)}"`],
        ]
      : []
  )
}
