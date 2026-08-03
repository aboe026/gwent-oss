import {
  Effect,
  EffectFromLeader,
  EffectFromUnit,
  EffectReason,
  FieldUnitEffect,
  Leader,
  Unit,
} from '@gwent-oss/graphql-schema/resolver-typings'
import {
  EffectFromLeaderDbObject,
  EffectFromUnitDbObject,
  FieldUnitEffectDbObject,
} from '@gwent-oss/graphql-schema/database-typings'
import { EffectReasonType } from '@gwent-oss/graphql-schema'
import EffectResolver from './effect-resolver'
import LeaderResolver from './leader-resolver'
import UnitResolver from './unit-resolver'

/**
 * A class to convert FieldUnitEffect database objects to their GraphQL equivalent.
 */
export default class FieldUnitEffectResolver {
  /**
   * Converts a single FieldUnitEffect database object to a single FieldUnitEffect GraphQL object.
   *
   * @param config The configuration to use when resolving the FieldUnit object.
   * @param config.fieldUnitEffect The database object to resolve to its GraphQL type.
   * @param config.unit The resolved Unit for the FieldUnitEffect. If not provided, will be retrieved.
   * @param config.effect The resolved Effect for the FieldUnitEffect. If not provided, will be retrieved.
   * @param config.leader The resolved Leader for the FieldUnitEffect. If not provided, will be retrieved.
   * @returns The resolved FieldUnitEffect object matching its GraphQL schema definition.
   * @throws {Error} if the effect reason type is invalid.
   */
  static async fromObject({
    fieldUnitEffect,
    unit,
    effect,
    leader,
  }: {
    fieldUnitEffect: FieldUnitEffectDbObject
    unit?: Unit
    effect?: Effect
    leader?: Leader
  }): Promise<FieldUnitEffect> {
    let reason: EffectReason | undefined
    if (fieldUnitEffect.reason.type === EffectReasonType.Unit) {
      const unitReasonDbObject = fieldUnitEffect.reason as EffectFromUnitDbObject
      const unitReason: EffectFromUnit = {
        effect: effect || (await EffectResolver.fromId(unitReasonDbObject.effect)),
        unit:
          unit ||
          (await UnitResolver.fromId({
            id: unitReasonDbObject.unit,
          })),
        __typename: 'EffectFromUnit',
      }
      reason = unitReason
    } else if (fieldUnitEffect.reason.type === EffectReasonType.Leader) {
      const leaderReasonDbObject = fieldUnitEffect.reason as EffectFromLeaderDbObject
      const leaderReason: EffectFromLeader = {
        leader:
          leader ||
          (await LeaderResolver.fromId({
            id: leaderReasonDbObject.leader,
          })),
        __typename: 'EffectFromLeader',
      }
      reason = leaderReason
    } else {
      throw Error(`Invalid EffectReasonType "${fieldUnitEffect.reason.type}".`)
    }
    return {
      operator: fieldUnitEffect.operator,
      reason,
      total: fieldUnitEffect.total,
    }
  }

  /**
   * Converts an array of FieldUnitEffect database objects to an array of FieldUnitEffect GraphQL objects.
   *
   * @param config The configuration used to resolve the array of FieldUnitEffects.
   * @param config.fieldUnitEffects The database objects to resolve to their GraphQL types.
   * @returns The resolved FieldUnitEffect array matching the GraphQL schema definition.
   */
  static async fromArray({
    fieldUnitEffects,
  }: {
    fieldUnitEffects: FieldUnitEffectDbObject[] | undefined
  }): Promise<FieldUnitEffect[]> {
    if (!fieldUnitEffects) {
      return []
    }
    let effects: Effect[] = []
    let units: Unit[] = []
    let leaders: Leader[] = []

    const effectIds: string[] = []
    const unitIds: string[] = []
    const leaderIds: string[] = []

    for (const fieldUnitEffect of fieldUnitEffects) {
      if (fieldUnitEffect.reason.type === EffectReasonType.Unit) {
        const unitReason = fieldUnitEffect.reason as EffectFromUnitDbObject
        const reasonEffectId = unitReason.effect.toString()
        if (!effectIds.includes(reasonEffectId)) {
          effectIds.push(reasonEffectId)
        }
        const reasonUnitId = unitReason.unit.toString()
        if (!unitIds.includes(reasonUnitId)) {
          unitIds.push(reasonUnitId)
        }
      } else if (fieldUnitEffect.reason.type === EffectReasonType.Leader) {
        const leaderReason = fieldUnitEffect.reason as EffectFromLeaderDbObject
        const reasonLeaderId = leaderReason.leader.toString()
        if (!leaderIds.includes(reasonLeaderId)) {
          leaderIds.push(reasonLeaderId)
        }
      } else {
        throw Error(`Invalid EffectReasonType "${fieldUnitEffect.reason.type}".`)
      }
    }

    if (effectIds.length > 0) {
      effects = await EffectResolver.fromIds(effectIds)
    }
    if (unitIds.length > 0) {
      units = await UnitResolver.fromIds({
        ids: unitIds,
      })
    }
    if (leaderIds.length > 0) {
      leaders = await LeaderResolver.fromIds({
        ids: leaderIds,
      })
    }

    const resolvedFieldUnitEffects: FieldUnitEffect[] = []
    for (const fieldUnitEffect of fieldUnitEffects) {
      let matchingEffect: Effect | undefined = undefined
      let matchingUnit: Unit | undefined = undefined
      let matchingLeader: Leader | undefined = undefined

      if (fieldUnitEffect.reason.type === EffectReasonType.Unit) {
        const unitEffectReason = fieldUnitEffect.reason as EffectFromUnitDbObject
        matchingEffect = effects.find((effect) => effect.id === unitEffectReason.effect.toString())
        matchingUnit = units.find((unit) => unit.id === unitEffectReason.unit.toString())
      } else {
        const leaderEffectReason = fieldUnitEffect.reason as EffectFromLeaderDbObject
        matchingLeader = leaders.find((leader) => leader.id === leaderEffectReason.leader.toString())
      }

      resolvedFieldUnitEffects.push(
        await FieldUnitEffectResolver.fromObject({
          fieldUnitEffect: fieldUnitEffect,
          effect: matchingEffect,
          unit: matchingUnit,
          leader: matchingLeader,
        })
      )
    }

    return resolvedFieldUnitEffects
  }
}
