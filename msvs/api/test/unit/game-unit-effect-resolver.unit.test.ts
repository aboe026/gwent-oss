import { ObjectId } from 'mongodb'

import {
  Effect,
  EffectFromLeader,
  EffectFromUnit,
  FieldUnitEffect,
  Leader,
  Unit,
} from '@gwent/graphql-schema/resolver-typings'
import {
  EffectFromLeaderDbObject,
  EffectFromUnitDbObject,
  FieldUnitEffectDbObject,
} from '@gwent/graphql-schema/database-typings'
import { EFFECT_OPERATOR } from '@gwent/constants'
import { EffectReasonType } from '@gwent/graphql-schema'
import EffectResolver from '../../src/graphql/resolvers/types/effect-resolver'
import FieldUnitEffectResolver from '../../src/graphql/resolvers/types/field-unit-effect-resolver'
import LeaderResolver from '../../src/graphql/resolvers/types/leader-resolver'
import TestUtil from '../util/test-util'
import UnitResolver from '../../src/graphql/resolvers/types/unit-resolver'

describe('game-unit-effect-resolver', () => {
  describe('fromObject', () => {
    it('throws error if invalid reason type', async () => {
      const type = 'invalid'
      await testFromObject({
        fieldUnitEffect: {
          operator: EFFECT_OPERATOR.Plus,
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
        fieldUnitEffect: {
          operator: EFFECT_OPERATOR.Plus,
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
        fieldUnitEffect: {
          operator: EFFECT_OPERATOR.Plus,
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
        fieldUnitEffect: {
          operator: EFFECT_OPERATOR.Plus,
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
        fieldUnitEffect: {
          operator: EFFECT_OPERATOR.Plus,
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
        fieldUnitEffects: [
          {
            operator: EFFECT_OPERATOR.Plus,
            reason: {
              type,
            } as any,
            total: 1,
          },
        ],
        expected: Error(`Invalid EffectReasonType "${type}".`),
      })
    })
    it('throws empty array if fieldUnitEffects undefined', async () => {
      await testFromArray({
        fieldUnitEffects: undefined,
        expected: [],
      })
    })
    describe('EffectFromUnit', () => {
      it('calls to effect and unit resolvers if single effect', async () => {
        const effect = TestUtil.getEffect({})
        const unit = TestUtil.getUnit({})
        const fieldUnitEffect = {
          operator: EFFECT_OPERATOR.Plus,
          reason: {
            effect: new ObjectId(effect.id),
            type: EffectReasonType.Unit,
            unit: new ObjectId(unit.id),
          } as EffectFromUnitDbObject,
          total: 1,
        }
        await testFromArray({
          fieldUnitEffects: [fieldUnitEffect],
          effectsResponse: [effect],
          unitsResponse: [unit],
          expected: [
            {
              operator: EFFECT_OPERATOR.Plus,
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
                fieldUnitEffect,
                effect,
                unit,
                leader: undefined,
              },
            ],
          ],
        })
      })
      it('calls to effect and unit resolvers if multiple effects', async () => {
        const effect = TestUtil.getEffect({})
        const unit = TestUtil.getUnit({})
        const fieldUnitEffect1 = {
          operator: EFFECT_OPERATOR.Plus,
          reason: {
            effect: new ObjectId(effect.id),
            type: EffectReasonType.Unit,
            unit: new ObjectId(unit.id),
          } as EffectFromUnitDbObject,
          total: 1,
        }
        const fieldUnitEffect2 = {
          operator: EFFECT_OPERATOR.Plus,
          reason: {
            effect: new ObjectId(effect.id),
            type: EffectReasonType.Unit,
            unit: new ObjectId(unit.id),
          } as EffectFromUnitDbObject,
          total: 1,
        }
        await testFromArray({
          fieldUnitEffects: [fieldUnitEffect1, fieldUnitEffect2],
          effectsResponse: [effect],
          unitsResponse: [unit],
          expected: [
            {
              operator: EFFECT_OPERATOR.Plus,
              reason: {
                effect,
                unit,
                __typename: 'EffectFromUnit',
              } as EffectFromUnit,
              total: 1,
            },
            {
              operator: EFFECT_OPERATOR.Plus,
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
                fieldUnitEffect: fieldUnitEffect1,
                effect,
                unit,
                leader: undefined,
              },
            ],
            [
              {
                fieldUnitEffect: fieldUnitEffect2,
                effect,
                unit,
                leader: undefined,
              },
            ],
          ],
        })
      })
    })
    describe('EffectFromLeader', () => {
      it('calls to leader resolver if single effect', async () => {
        const leader = TestUtil.getLeader({})
        const fieldUnitEffect = {
          operator: EFFECT_OPERATOR.Plus,
          reason: {
            leader: new ObjectId(leader.id),
            type: EffectReasonType.Leader,
          } as EffectFromLeaderDbObject,
          total: 1,
        }
        await testFromArray({
          fieldUnitEffects: [fieldUnitEffect],
          leadersResponse: [leader],
          expected: [
            {
              operator: EFFECT_OPERATOR.Plus,
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
                fieldUnitEffect,
                effect: undefined,
                unit: undefined,
                leader,
              },
            ],
          ],
        })
      })
      it('calls to leader resolver if multiple effects', async () => {
        const leader = TestUtil.getLeader({})
        const fieldUnitEffect1 = {
          operator: EFFECT_OPERATOR.Plus,
          reason: {
            leader: new ObjectId(leader.id),
            type: EffectReasonType.Leader,
          } as EffectFromLeaderDbObject,
          total: 1,
        }
        const fieldUnitEffect2 = {
          operator: EFFECT_OPERATOR.Plus,
          reason: {
            leader: new ObjectId(leader.id),
            type: EffectReasonType.Leader,
          } as EffectFromLeaderDbObject,
          total: 1,
        }
        await testFromArray({
          fieldUnitEffects: [fieldUnitEffect1, fieldUnitEffect2],
          leadersResponse: [leader],
          expected: [
            {
              operator: EFFECT_OPERATOR.Plus,
              reason: {
                leader,
                __typename: 'EffectFromLeader',
              } as EffectFromLeader,
              total: 1,
            },
            {
              operator: EFFECT_OPERATOR.Plus,
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
                fieldUnitEffect: fieldUnitEffect1,
                effect: undefined,
                unit: undefined,
                leader,
              },
            ],
            [
              {
                fieldUnitEffect: fieldUnitEffect2,
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
})

async function testFromObject({
  fieldUnitEffect,
  unit,
  effect,
  leader,
  error,
}: {
  fieldUnitEffect: FieldUnitEffectDbObject
  unit?: Unit
  effect?: Effect
  leader?: Leader
  error?: Error
}) {
  const resolvedEffect =
    effect ||
    TestUtil.getEffect({
      id: (fieldUnitEffect.reason as EffectFromUnitDbObject).effect,
    })
  const resolvedUnit =
    unit ||
    TestUtil.getUnit({
      id: (fieldUnitEffect.reason as EffectFromUnitDbObject).unit,
    })
  const resolvedLeader =
    leader ||
    TestUtil.getLeader({
      id: (fieldUnitEffect.reason as EffectFromLeaderDbObject).leader,
    })
  const effectResolverSpy = jest.spyOn(EffectResolver, 'fromId').mockResolvedValue(resolvedEffect)
  const unitResolverSpy = jest.spyOn(UnitResolver, 'fromId').mockResolvedValue(resolvedUnit)
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'fromId').mockResolvedValue(resolvedLeader)

  const promise = FieldUnitEffectResolver.fromObject({
    fieldUnitEffect,
    effect,
    leader,
    unit,
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual({
      operator: fieldUnitEffect.operator,
      reason:
        fieldUnitEffect.reason.type === EffectReasonType.Leader
          ? {
              leader: resolvedLeader,
              __typename: 'EffectFromLeader',
            }
          : {
              effect: resolvedEffect,
              unit: resolvedUnit,
              __typename: 'EffectFromUnit',
            },
      total: fieldUnitEffect.total,
    })
  }

  expect(effectResolverSpy.mock.calls).toEqual(
    fieldUnitEffect.reason.type === EffectReasonType.Unit && !effect
      ? [[(fieldUnitEffect.reason as EffectFromUnitDbObject).effect]]
      : []
  )
  expect(unitResolverSpy.mock.calls).toEqual(
    fieldUnitEffect.reason.type === EffectReasonType.Unit && !unit
      ? [
          [
            {
              id: (fieldUnitEffect.reason as EffectFromUnitDbObject).unit,
            },
          ],
        ]
      : []
  )
  expect(leaderResolverSpy.mock.calls).toEqual(
    fieldUnitEffect.reason.type === EffectReasonType.Leader && !leader
      ? [
          [
            {
              id: (fieldUnitEffect.reason as EffectFromLeaderDbObject).leader,
            },
          ],
        ]
      : []
  )
}

async function testFromArray({
  fieldUnitEffects,
  effectsResponse,
  unitsResponse,
  leadersResponse,
  expected,
  effectCalls = [],
  unitCalls = [],
  leaderCalls = [],
  fromObjectCalls = [],
}: {
  fieldUnitEffects: FieldUnitEffectDbObject[] | undefined
  effectsResponse?: Effect[]
  unitsResponse?: Unit[]
  leadersResponse?: Leader[]
  expected?: FieldUnitEffect[] | Error
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
  const fromObjectSpy = jest.spyOn(FieldUnitEffectResolver, 'fromObject')
  if (expected && !(expected instanceof Error)) {
    for (const fieldUnitEffect of expected) {
      fromObjectSpy.mockResolvedValueOnce(fieldUnitEffect)
    }
  }

  const promise = FieldUnitEffectResolver.fromArray({
    fieldUnitEffects,
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
