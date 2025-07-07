import { ObjectId } from 'mongodb'

import {
  Effect,
  EffectFromLeader,
  EffectFromUnit,
  GameUnitEffect,
  Leader,
  Unit,
} from '@gwent/graphql-schema/resolver-typings'
import {
  EffectFromLeaderDbObject,
  EffectFromUnitDbObject,
  GameUnitEffectDbObject,
} from '@gwent/graphql-schema/database-typings'
import { EffectReasonType } from '@gwent/graphql-schema'
import EffectResolver from '../../src/graphql/resolvers/types/effect-resolver'
import GameUnitEffectResolver from '../../src/graphql/resolvers/types/game-unit-effect-resolver'
import LeaderResolver from '../../src/graphql/resolvers/types/leader-resolver'
import TestUtil from '../util/test-util'
import UnitResolver from '../../src/graphql/resolvers/types/unit-resolver'

describe('game-unit-effect-resolver', () => {
  describe('fromObject', () => {
    it('throws error if invalid reason type', async () => {
      const type = 'invalid'
      await testFromObject({
        gameUnitEffect: {
          operator: '+1',
          reason: {
            type,
          } as any,
          total: 1,
        },
        error: Error(`Invalid EffectReasonType "${type}".`),
      })
    })
    it('calls out to resolve unit and effects if none provided and EffectFromUnit', async () => {
      await testFromObject({
        gameUnitEffect: {
          operator: '+1',
          reason: {
            type: EffectReasonType.Unit,
            effect: new ObjectId(),
            unit: new ObjectId(),
          } as EffectFromUnitDbObject,
          total: 1,
        },
      })
    })
    it('calls out to resolve leader if none provided and EffectFromLeader', async () => {
      await testFromObject({
        gameUnitEffect: {
          operator: '+1',
          reason: {
            type: EffectReasonType.Leader,
            leader: new ObjectId(),
          } as EffectFromLeaderDbObject,
          total: 1,
        },
      })
    })
    it('does not resolve unit and effects if provided and EffectFromUnit', async () => {
      const effectId = new ObjectId()
      const unitId = new ObjectId()
      await testFromObject({
        gameUnitEffect: {
          operator: '+1',
          reason: {
            type: EffectReasonType.Unit,
            effect: effectId,
            unit: unitId,
          } as EffectFromUnitDbObject,
          total: 1,
        },
        effect: TestUtil.getEffect({
          id: effectId,
        }),
        unit: TestUtil.getUnit({
          id: unitId,
        }),
      })
    })
    it('does not resolve leader if provided and EffectFromLeader', async () => {
      const leaderId = new ObjectId()
      await testFromObject({
        gameUnitEffect: {
          operator: '+1',
          reason: {
            type: EffectReasonType.Leader,
            leader: leaderId,
          } as EffectFromLeaderDbObject,
          total: 1,
        },
        leader: TestUtil.getLeader({
          id: leaderId,
        }),
      })
    })
  })
  describe('fromArray', () => {
    it('throws error if invalid effect reason type', async () => {
      const type = 'invalid'
      await testFromArray({
        gameUnitEffects: [
          {
            operator: '+1',
            reason: {
              type,
            } as any,
            total: 1,
          },
        ],
        expected: Error(`Invalid EffectReasonType "${type}".`),
      })
    })
    it('throws empty array if gameUnitEffects undefined', async () => {
      await testFromArray({
        gameUnitEffects: undefined,
        expected: [],
      })
    })
    it('calls to effect and unit resolvers if EffectFromUnit', async () => {
      const effect = TestUtil.getEffect({})
      const unit = TestUtil.getUnit({})
      const gameUnitEffect = {
        operator: '+1',
        reason: {
          effect: new ObjectId(effect.id),
          type: EffectReasonType.Unit,
          unit: new ObjectId(unit.id),
        } as EffectFromUnitDbObject,
        total: 1,
      }
      await testFromArray({
        gameUnitEffects: [gameUnitEffect],
        effectsResponse: [effect],
        unitsResponse: [unit],
        expected: [
          {
            operator: '+1',
            reason: {
              effect,
              unit,
              __typename: 'EffectFromUnit',
            } as EffectFromUnit,
            total: 1,
          },
        ],
        effectCalls: [[[effect.id]]],
        unitCalls: [
          [
            {
              ids: [unit.id],
            },
          ],
        ],
        fromObjectCalls: [
          [
            {
              gameUnitEffect,
              effect,
              unit,
              leader: undefined,
            },
          ],
        ],
      })
    })
    it('calls to leader resolver if EffectFromLeader', async () => {
      const leader = TestUtil.getLeader({})
      const gameUnitEffect = {
        operator: '+1',
        reason: {
          leader: new ObjectId(leader.id),
          type: EffectReasonType.Leader,
        } as EffectFromLeaderDbObject,
        total: 1,
      }
      await testFromArray({
        gameUnitEffects: [gameUnitEffect],
        leadersResponse: [leader],
        expected: [
          {
            operator: '+1',
            reason: {
              leader,
              __typename: 'EffectFromLeader',
            } as EffectFromLeader,
            total: 1,
          },
        ],
        leaderCalls: [
          [
            {
              ids: [leader.id],
            },
          ],
        ],
        fromObjectCalls: [
          [
            {
              gameUnitEffect,
              effect: undefined,
              unit: undefined,
              leader,
            },
          ],
        ],
      })
    })
  })
})

async function testFromObject({
  gameUnitEffect,
  unit,
  effect,
  leader,
  error,
}: {
  gameUnitEffect: GameUnitEffectDbObject
  unit?: Unit
  effect?: Effect
  leader?: Leader
  error?: Error
}) {
  const resolvedEffect =
    effect ||
    TestUtil.getEffect({
      id: (gameUnitEffect.reason as EffectFromUnitDbObject).effect,
    })
  const resolvedUnit =
    unit ||
    TestUtil.getUnit({
      id: (gameUnitEffect.reason as EffectFromUnitDbObject).unit,
    })
  const resolvedLeader =
    leader ||
    TestUtil.getLeader({
      id: (gameUnitEffect.reason as EffectFromLeaderDbObject).leader,
    })
  const effectResolverSpy = jest.spyOn(EffectResolver, 'fromId').mockResolvedValue(resolvedEffect)
  const unitResolverSpy = jest.spyOn(UnitResolver, 'fromId').mockResolvedValue(resolvedUnit)
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'fromId').mockResolvedValue(resolvedLeader)

  const promise = GameUnitEffectResolver.fromObject({
    gameUnitEffect,
    effect,
    leader,
    unit,
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual({
      operator: gameUnitEffect.operator,
      reason:
        gameUnitEffect.reason.type === EffectReasonType.Leader
          ? {
              leader: resolvedLeader,
              __typename: 'EffectFromLeader',
            }
          : {
              effect: resolvedEffect,
              unit: resolvedUnit,
              __typename: 'EffectFromUnit',
            },
      total: gameUnitEffect.total,
    })
  }

  expect(effectResolverSpy.mock.calls).toEqual(
    gameUnitEffect.reason.type === EffectReasonType.Unit && !effect
      ? [[(gameUnitEffect.reason as EffectFromUnitDbObject).effect]]
      : []
  )
  expect(unitResolverSpy.mock.calls).toEqual(
    gameUnitEffect.reason.type === EffectReasonType.Unit && !unit
      ? [
          [
            {
              id: (gameUnitEffect.reason as EffectFromUnitDbObject).unit,
            },
          ],
        ]
      : []
  )
  expect(leaderResolverSpy.mock.calls).toEqual(
    gameUnitEffect.reason.type === EffectReasonType.Leader && !leader
      ? [
          [
            {
              id: (gameUnitEffect.reason as EffectFromLeaderDbObject).leader,
            },
          ],
        ]
      : []
  )
}

async function testFromArray({
  gameUnitEffects,
  effectsResponse,
  unitsResponse,
  leadersResponse,
  expected,
  effectCalls = [],
  unitCalls = [],
  leaderCalls = [],
  fromObjectCalls = [],
}: {
  gameUnitEffects: GameUnitEffectDbObject[] | undefined
  effectsResponse?: Effect[]
  unitsResponse?: Unit[]
  leadersResponse?: Leader[]
  expected?: GameUnitEffect[] | Error
  effectCalls?: any[][]
  unitCalls?: any[][]
  leaderCalls?: any[][]
  fromObjectCalls?: any[][]
}) {
  const effectSpy = jest.spyOn(EffectResolver, 'fromIds')
  if (effectsResponse) {
    effectSpy.mockResolvedValue(effectsResponse)
  }
  const unitSpy = jest.spyOn(UnitResolver, 'fromIds')
  if (unitsResponse) {
    unitSpy.mockResolvedValue(unitsResponse)
  }
  const leaderSpy = jest.spyOn(LeaderResolver, 'fromIds')
  if (leadersResponse) {
    leaderSpy.mockResolvedValue(leadersResponse)
  }
  const fromObjectSpy = jest.spyOn(GameUnitEffectResolver, 'fromObject')
  if (expected && !(expected instanceof Error)) {
    for (const gameUnitEffect of expected) {
      fromObjectSpy.mockResolvedValueOnce(gameUnitEffect)
    }
  }

  const promise = GameUnitEffectResolver.fromArray({
    gameUnitEffects,
  })
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(effectSpy.mock.calls).toEqual(effectCalls)
  expect(unitSpy.mock.calls).toEqual(unitCalls)
  expect(leaderSpy.mock.calls).toEqual(leaderCalls)
  expect(fromObjectSpy.mock.calls).toEqual(fromObjectCalls)
}
