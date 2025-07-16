import {
  Effect,
  EffectFromLeader,
  EffectFromUnit,
  EffectReason,
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
import EffectResolver from './effect-resolver'
import LeaderResolver from './leader-resolver'
import UnitResolver from './unit-resolver'

/**
 * A class to convert GameUnitEffect database objects to their GraphQL equivalent.
 */
export default class GameUnitEffectResolver {
  /**
   * Converts a single GameUnit database object to a single GameUnit GraphQL object.
   *
   * @param config The configuration to use when resolving the GameUnit object.
   * @param config.gameUnitEffect The database object to resolve to its GraphQL type.
   * @param config.unit The resolved Unit for the GameUnitEffect. If not provided, will be retrieved.
   * @param config.effect The resolved Effect for the GameUnitEffect. If not provided, will be retrieved.
   * @param config.leader The resolved Leader for the GameUnitEffect. If not provided, will be retrieved.
   * @returns The resolved GameUnit object matching its GraphQL schema definition.
   * @throws Error if the effect reason type is invalid.
   */
  static async fromObject({
    gameUnitEffect,
    unit,
    effect,
    leader,
  }: {
    gameUnitEffect: GameUnitEffectDbObject
    unit?: Unit
    effect?: Effect
    leader?: Leader
  }): Promise<GameUnitEffect> {
    let reason: EffectReason | undefined = undefined
    if (gameUnitEffect.reason.type === EffectReasonType.Unit) {
      const unitReasonDbObject = gameUnitEffect.reason as EffectFromUnitDbObject
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
    } else if (gameUnitEffect.reason.type === EffectReasonType.Leader) {
      const leaderReasonDbObject = gameUnitEffect.reason as EffectFromLeaderDbObject
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
      throw Error(`Invalid EffectReasonType "${gameUnitEffect.reason.type}".`)
    }
    return {
      operator: gameUnitEffect.operator,
      reason,
      total: gameUnitEffect.total,
    }
  }

  /**
   * Converts an array of GameUnit database objects to an array of GameUnit GraphQL objects.
   *
   * @param config The configuration used to resolve the array of GameUnits.
   * @param config.gameUnitEffects The database objects to resolve to their GraphQL types.
   * @returns The resolved GameUnit array matching the GraphQL schema definition.
   */
  static async fromArray({
    gameUnitEffects,
  }: {
    gameUnitEffects: GameUnitEffectDbObject[] | undefined
  }): Promise<GameUnitEffect[]> {
    if (!gameUnitEffects) {
      return []
    }
    let effects: Effect[] = []
    let units: Unit[] = []
    let leaders: Leader[] = []

    const effectIds: string[] = []
    const unitIds: string[] = []
    const leaderIds: string[] = []

    for (const gameUnitEffect of gameUnitEffects) {
      if (gameUnitEffect.reason.type === EffectReasonType.Unit) {
        const unitReason = gameUnitEffect.reason as EffectFromUnitDbObject
        const reasonEffectId = unitReason.effect.toString()
        if (!effectIds.includes(reasonEffectId)) {
          effectIds.push(reasonEffectId)
        }
        const reasonUnitId = unitReason.unit.toString()
        if (!unitIds.includes(reasonUnitId)) {
          unitIds.push(reasonUnitId)
        }
      } else if (gameUnitEffect.reason.type === EffectReasonType.Leader) {
        const leaderReason = gameUnitEffect.reason as EffectFromLeaderDbObject
        const reasonLeaderId = leaderReason.leader.toString()
        if (!leaderIds.includes(reasonLeaderId)) {
          leaderIds.push(reasonLeaderId)
        }
      } else {
        throw Error(`Invalid EffectReasonType "${gameUnitEffect.reason.type}".`)
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

    const resolvedGameUnitEffects: GameUnitEffect[] = []
    for (const gameUnitEffect of gameUnitEffects) {
      let matchingEffect: Effect | undefined = undefined
      let matchingUnit: Unit | undefined = undefined
      let matchingLeader: Leader | undefined = undefined

      if (gameUnitEffect.reason.type === EffectReasonType.Unit) {
        const unitEffectReason = gameUnitEffect.reason as EffectFromUnitDbObject
        matchingEffect = effects.find((effect) => effect.id === unitEffectReason.effect.toString())
        matchingUnit = units.find((unit) => unit.id === unitEffectReason.unit.toString())
      } else {
        const leaderEffectReason = gameUnitEffect.reason as EffectFromLeaderDbObject
        matchingLeader = leaders.find((leader) => leader.id === leaderEffectReason.leader.toString())
      }

      resolvedGameUnitEffects.push(
        await GameUnitEffectResolver.fromObject({
          gameUnitEffect,
          effect: matchingEffect,
          unit: matchingUnit,
          leader: matchingLeader,
        })
      )
    }

    return resolvedGameUnitEffects
  }
}
