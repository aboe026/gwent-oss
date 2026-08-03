import { ObjectId } from 'mongodb'

import { GameUnit, Impact, Unit, User } from '@gwent-oss/graphql-schema/resolver-typings'
import { GameUnitOrigin, ImpactDbObject } from '@gwent-oss/graphql-schema/database-typings'
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
      const message = `Could not find impact unit "${impact.unit?.unit}"`
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
            id: impact.unit?.unit,
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
            id: impact.unit?.unit,
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
    it('reaches out to resolve users and units if not provided without impact unit', async () => {
      const unit = TestUtil.getUnit({})
      const impact: ImpactDbObject = {
        unit: undefined,
        user: new ObjectId(),
      }
      const impactUser = TestUtil.getUser({
        id: impact.user,
      })
      await testFromObject({
        impact,
        resolvedUsers: [impactUser],
        resolvedUnits: [unit],
        expected: {
          unit: undefined,
          user: impactUser,
        },
      })
    })
    it('reaches out to resolve users and units if not provided with impact unit', async () => {
      const unit = TestUtil.getUnit({})
      const fieldUnit = TestUtil.getFieldUnit({
        unit,
      })
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({
          artStyle: fieldUnit.artStyle,
          effectiveStrength: fieldUnit.effectiveStrength,
          id: fieldUnit.unit.id,
          row: fieldUnit.row,
        }),
        user: new ObjectId(),
      }
      const impactUser = TestUtil.getUser({
        id: impact.user,
      })
      await testFromObject({
        impact,
        resolvedUsers: [impactUser],
        resolvedUnits: [unit],
        resolvedGameUnit: fieldUnit,
        expected: {
          unit: fieldUnit,
          user: impactUser,
        },
      })
    })
    it('does not reach out to resolve users and units if provided without impact unit', async () => {
      const unit = TestUtil.getUnit({})
      const impact: ImpactDbObject = {
        unit: undefined,
        user: new ObjectId(),
      }
      const impactUser = TestUtil.getUser({
        id: impact.user,
      })
      await testFromObject({
        impact,
        users: [impactUser],
        units: [unit],
        expected: {
          unit: undefined,
          user: impactUser,
        },
      })
    })
    it('does not reach out to resolve users and units if provided with impact unit', async () => {
      const unit = TestUtil.getUnit({})
      const fieldUnit = TestUtil.getFieldUnit({
        unit,
      })
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({
          artStyle: fieldUnit.artStyle,
          effectiveStrength: fieldUnit.effectiveStrength,
          id: fieldUnit.unit.id,
          row: fieldUnit.row,
        }),
        user: new ObjectId(),
      }
      const impactUser = TestUtil.getUser({
        id: impact.user,
      })
      await testFromObject({
        impact,
        users: [impactUser],
        units: [unit],
        resolvedGameUnit: fieldUnit,
        expected: {
          unit: fieldUnit,
          user: impactUser,
        },
      })
    })
    it('returns source user if set', async () => {
      const impactUser = TestUtil.getUser({})
      const sourceUser = TestUtil.getUser({})
      const unit = TestUtil.getUnit({})
      const fieldUnit = TestUtil.getFieldUnit({
        unit,
      })
      const origin = GameUnitOrigin.Hand
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({
          artStyle: fieldUnit.artStyle,
          effectiveStrength: fieldUnit.effectiveStrength,
          id: fieldUnit.unit.id,
          row: fieldUnit.row,
        }),
        source: {
          origin,
          user: new ObjectId(sourceUser.id),
        },
        user: new ObjectId(impactUser.id),
      }
      await testFromObject({
        impact,
        resolvedUsers: [impactUser, sourceUser],
        resolvedUnits: [unit],
        resolvedGameUnit: fieldUnit,
        expected: {
          unit: fieldUnit,
          user: impactUser,
          source: {
            origin,
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
      const unit = TestUtil.getUnit({})
      const fieldUnit = TestUtil.getFieldUnit({
        unit,
      })
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({
          artStyle: fieldUnit.artStyle,
          effectiveStrength: fieldUnit.effectiveStrength,
          id: fieldUnit.unit.id,
          row: fieldUnit.row,
        }),
        user: new ObjectId(),
      }
      await testFromArray({
        impacts: [impact],
        resolvedUnits: [unit],
        resolvedUsers: [
          TestUtil.getUser({
            id: impact.user,
          }),
        ],
      })
    })
    it('returns multiple impacts without prefetched input', async () => {
      const unit1 = TestUtil.getUnit({})
      const fieldUnit1 = TestUtil.getFieldUnit({
        unit: unit1,
      })
      const impact1: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({
          artStyle: fieldUnit1.artStyle,
          effectiveStrength: fieldUnit1.effectiveStrength,
          id: fieldUnit1.unit.id,
          row: fieldUnit1.row,
        }),
        user: new ObjectId(),
      }
      const unit2 = TestUtil.getUnit({})
      const fieldUnit2 = TestUtil.getFieldUnit({
        unit: unit2,
      })
      const impact2: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({
          artStyle: fieldUnit2.artStyle,
          effectiveStrength: fieldUnit2.effectiveStrength,
          id: fieldUnit2.unit.id,
          row: fieldUnit2.row,
        }),
        user: new ObjectId(),
      }
      await testFromArray({
        impacts: [impact1, impact2],
        resolvedUnits: [unit1, unit2],
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
      const unit = TestUtil.getUnit({})
      const fieldUnit = TestUtil.getFieldUnit({
        unit,
      })
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({
          artStyle: fieldUnit.artStyle,
          effectiveStrength: fieldUnit.effectiveStrength,
          id: fieldUnit.unit.id,
          row: fieldUnit.row,
        }),
        user: new ObjectId(),
      }
      await testFromArray({
        impacts: [impact],
        resolvedUnits: [unit],
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
  const resolveUsersAndUnitsSpy = jest.spyOn(ResolverUtil, 'resolveUsersAndUnits').mockResolvedValue({
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

  expect(resolveUsersAndUnitsSpy.mock.calls).toEqual([
    [
      {
        impacts: [impact],
        presolvedUsers: users,
        presolvedUnits: units,
      },
    ],
  ])
  expect(gameUnitResolverSpy.mock.calls).toEqual(
    expected instanceof Error || !impact.unit
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
  const resolveUsersAndUnitsSpy = jest.spyOn(ResolverUtil, 'resolveUsersAndUnits').mockResolvedValue({
    units: units || resolvedUnits,
    users: users || resolvedUsers,
  })
  const impactFromObjectSpy = jest.spyOn(ImpactResolver, 'fromObject')
  const resolvedImpacts: Impact[] = []
  if (impacts) {
    for (let i = 0; i < impacts.length; i++) {
      const impact = impacts[i]
      const resolvedImpact: Impact = {
        user: TestUtil.getUser({
          id: impact.user,
        }),
      }
      if (impact.unit) {
        resolvedImpact.unit = TestUtil.getGameUnitFromDbGameUnit({
          gameUnit: impact.unit,
          unit: (units || resolvedUnits)[i],
        })
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

  expect(resolveUsersAndUnitsSpy.mock.calls).toEqual(
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
