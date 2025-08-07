import { ObjectId } from 'mongodb'

import { GameUnit, Impact, Unit, User } from '@gwent/graphql-schema/resolver-typings'
import { GameUnitOrigin, ImpactDbObject } from '@gwent/graphql-schema/database-typings'
import GameUnitResolver from '../../src/graphql/resolvers/types/game-unit-resolver'
import ImpactResolver from '../../src/graphql/resolvers/types/impact-resolver'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('impact-resolver', () => {
  describe('fromObject', () => {
    it('throws error if impact unit not found', async () => {
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const message = `Could not find impact unit "${impact.unit.unit}"`
      await testFromObject({
        impact,
        expected: Error(`${message}.`),
        errorCalls: [[`${message}, impact: "${JSON.stringify(impact)}"`]],
      })
    })
    it('throws error if impact user not found', async () => {
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const message = `Could not find impact user "${impact.user}"`
      await testFromObject({
        impact,
        resolvedUnits: [
          TestUtil.getUnit({
            id: impact.unit.unit,
          }),
        ],
        expected: Error(`${message}.`),
        errorCalls: [[`${message}, impact: "${JSON.stringify(impact)}"`]],
      })
    })
    it('throws error if source user not found', async () => {
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
        source: {
          origin: GameUnitOrigin.Hand,
          user: new ObjectId(),
        },
      }
      const message = `Could not find impact source user "${impact.source?.user}"`
      await testFromObject({
        impact,
        resolvedUnits: [
          TestUtil.getUnit({
            id: impact.unit.unit,
          }),
        ],
        resolvedUsers: [
          TestUtil.getUser({
            id: impact.user,
          }),
        ],
        expected: Error(`${message}.`),
        errorCalls: [[`${message}, impact: "${JSON.stringify(impact)}"`]],
      })
    })
    it('reaches out to resolve users and units if not provided', async () => {
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const gameUnit = TestUtil.getGameUnit({
        unit: TestUtil.getUnit({
          id: impact.unit.unit,
        }),
        effectiveStrength: impact.unit.effectiveStrength ? impact.unit.effectiveStrength : undefined,
        artStyle: impact.unit.artStyle,
        effects: [],
      })
      const impactUser = TestUtil.getUser({
        id: impact.user,
      })
      await testFromObject({
        impact,
        resolvedUsers: [impactUser],
        resolvedUnits: [gameUnit.unit],
        resolvedGameUnit: gameUnit,
        expected: {
          unit: gameUnit,
          user: impactUser,
        },
      })
    })
    it('does not reach out to resolve users and units if provided', async () => {
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const gameUnit = TestUtil.getGameUnit({
        unit: TestUtil.getUnit({
          id: impact.unit.unit,
        }),
        effectiveStrength: impact.unit.effectiveStrength ? impact.unit.effectiveStrength : undefined,
        artStyle: impact.unit.artStyle,
        effects: [],
      })
      const impactUser = TestUtil.getUser({
        id: impact.user,
      })
      await testFromObject({
        impact,
        users: [impactUser],
        units: [gameUnit.unit],
        resolvedGameUnit: gameUnit,
        expected: {
          unit: gameUnit,
          user: impactUser,
        },
      })
    })
    it('returns source user if set', async () => {
      const impactUser = TestUtil.getUser({})
      const sourceUser = TestUtil.getUser({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(impactUser.id),
        source: {
          origin: GameUnitOrigin.Hand,
          user: new ObjectId(sourceUser.id),
        },
      }
      const gameUnit = TestUtil.getGameUnit({
        unit: TestUtil.getUnit({
          id: impact.unit.unit,
        }),
        effectiveStrength: impact.unit.effectiveStrength ? impact.unit.effectiveStrength : undefined,
        artStyle: impact.unit.artStyle,
        effects: [],
      })
      await testFromObject({
        impact,
        resolvedUsers: [impactUser, sourceUser],
        resolvedUnits: [gameUnit.unit],
        resolvedGameUnit: gameUnit,
        expected: {
          unit: gameUnit,
          user: impactUser,
          source: {
            origin: GameUnitOrigin.Hand,
            user: sourceUser,
          },
        },
      })
    })
  })
  describe('fromArray', () => {
    it('returns undefined if given undefined', async () => {
      await testFromArray({
        impacts: undefined,
      })
    })
    it('returns empty array if given empty array', async () => {
      await testFromArray({
        impacts: [],
      })
    })
    it('returns single impact if no errors', async () => {
      const gameUnit = TestUtil.getDbGameUnit({})
      const impact = {
        unit: gameUnit,
        user: new ObjectId(),
      }
      await testFromArray({
        impacts: [impact],
        resolvedUnits: [
          TestUtil.getUnit({
            id: gameUnit.unit,
          }),
        ],
        resolvedUsers: [
          TestUtil.getUser({
            id: impact.user,
          }),
        ],
      })
    })
    it('returns multiple impacts without prefetched input', async () => {
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
      const gameUnit2 = TestUtil.getGameUnit({
        unit: TestUtil.getUnit({
          id: impact2.unit.unit,
          strength: undefined,
        }),
        artStyle: impact2.unit.artStyle,
        effectiveStrength: impact2.unit.effectiveStrength || undefined,
        effects: [],
      })
      await testFromArray({
        impacts: [impact1, impact2],
        resolvedUnits: [gameUnit1.unit, gameUnit2.unit],
        resolvedUsers: [
          TestUtil.getUser({
            id: impact1.user,
          }),
          TestUtil.getUser({
            id: impact2.user,
          }),
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
      await testFromArray({
        impacts: [impact],
        resolvedUnits: [gameUnit.unit],
        resolvedUsers: [
          TestUtil.getUser({
            id: impact.user,
          }),
        ],
        traceEnabled: true,
      })
    })
  })
})

async function testFromObject({
  impact,
  users,
  units,
  resolvedUsers = [],
  resolvedUnits = [],
  resolvedGameUnit,
  expected,
  errorCalls = [],
}: {
  impact: ImpactDbObject
  users?: User[]
  units?: Unit[]
  resolvedUsers?: User[]
  resolvedUnits?: Unit[]
  resolvedGameUnit?: GameUnit
  expected?: Impact | Error
  errorCalls?: string[][]
}) {
  const resolveMoveUsersAndUnitsSpy = jest.spyOn(ResolverUtil, 'resolveMoveUsersAndUnits').mockResolvedValue({
    units: units || resolvedUnits,
    users: users || resolvedUsers,
  })
  const gameUnitResolverSpy = jest.spyOn(GameUnitResolver, 'fromObject')
  if (resolvedGameUnit) {
    gameUnitResolverSpy.mockResolvedValue(resolvedGameUnit)
  }
  const errorSpy = jest.fn().mockImplementation()
  ImpactResolver['logger'] = {
    error: errorSpy,
  } as any

  const promise = ImpactResolver.fromObject({
    impact,
    users,
    units,
  })
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(resolveMoveUsersAndUnitsSpy.mock.calls).toEqual([
    [
      {
        impacts: [impact],
        presolvedUsers: users,
        presolvedUnits: units,
      },
    ],
  ])
  expect(gameUnitResolverSpy.mock.calls).toEqual(
    expected instanceof Error
      ? []
      : [
          [
            {
              gameUnit: impact.unit,
              unit: (units || resolvedUnits)[0],
            },
          ],
        ]
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}

async function testFromArray({
  impacts,
  units,
  users,
  resolvedUnits = [],
  resolvedUsers = [],
  traceEnabled,
}: {
  impacts: ImpactDbObject[] | undefined
  units?: Unit[]
  users?: User[]
  resolvedUnits?: Unit[]
  resolvedUsers?: User[]
  errorCalls?: string[][]
  traceEnabled?: boolean
}) {
  const resolveMoveUsersAndUnitsSpy = jest.spyOn(ResolverUtil, 'resolveMoveUsersAndUnits').mockResolvedValue({
    units: units || resolvedUnits,
    users: users || resolvedUsers,
  })
  const impactFromObjectSpy = jest.spyOn(ImpactResolver, 'fromObject')
  const resolvedImpacts: Impact[] = []
  if (impacts) {
    for (const impact of impacts) {
      const resolvedImpact: Impact = {
        unit: TestUtil.getGameUnitFromDbGameUnit({
          gameUnit: impact.unit,
        }),
        user: TestUtil.getUser({
          id: impact.user,
        }),
      }
      impactFromObjectSpy.mockResolvedValueOnce(resolvedImpact)
      resolvedImpacts.push(resolvedImpact)
    }
  }
  const traceSpy = jest.fn().mockImplementation()
  ImpactResolver['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(
    ImpactResolver.fromArray({
      impacts,
    })
  ).resolves.toEqual(impacts ? resolvedImpacts : undefined)

  expect(resolveMoveUsersAndUnitsSpy.mock.calls).toEqual(
    impacts
      ? [
          [
            {
              impacts,
              presolvedUnits: units,
              presolvedUsers: users,
            },
          ],
        ]
      : []
  )
  expect(impactFromObjectSpy.mock.calls).toEqual(
    impacts
      ? impacts.map((impact) => {
          return [
            {
              impact,
              units: units || resolvedUnits,
              users: users || resolvedUsers,
            },
          ]
        })
      : []
  )
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`impacts: "${JSON.stringify(impacts)}"`],
          [`resolvedUnits: "${JSON.stringify(resolvedUnits)}"`],
          [`resolvedUsers: "${JSON.stringify(resolvedUsers)}"`],
          [`resolvedImpacts: "${JSON.stringify(resolvedImpacts)}"`],
        ]
      : []
  )
}
