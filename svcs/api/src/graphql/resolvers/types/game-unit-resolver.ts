import {
  Effect,
  EffectFromLeader,
  EffectFromUnit,
  EffectReason,
  GameUnit,
  Leader,
  Unit,
} from '@gwent/graphql-schema/resolver-typings'
import {
  EffectFromLeaderDbObject,
  EffectFromUnitDbObject,
  GameUnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import UnitResolver from './unit-resolver'
import { EffectReasonType } from '@gwent/graphql-schema'
import EffectResolver from './effect-resolver'
import LeaderResolver from './leader-resolver'

/**
 * A class to convert GameUnit database objects to their GraphQL equivalent.
 */
export default class GameUnitResolver {
  /**
   * Converts a single GameUnit database object to a single GameUnit GraphQL object.
   *
   * @param config The configuration to use when resolving the GameUnit object.
   * @param config.gameUnit The database object to resolve to its GraphQL type.
   * @param config.unit An optional pre-resolved unit. If not specified, will retreive the Unit from the databae to resolve.
   * @returns The resolved GameUnit object matching its GraphQL schema definition.
   */
  static async fromObject({ gameUnit, unit }: { gameUnit: GameUnitDbObject; unit?: Unit }): Promise<GameUnit> {
    let effects: Effect[]
    let unitsForEffects: Unit[]
    let leaders: Leader[]
    if (gameUnit.effects) {
      const effectIds: string[] = []
      const unitIds: string[] = []
      const leaderIds: string[] = []
      for (const gameEffect of gameUnit.effects) {
        if (gameEffect.reason.type === EffectReasonType.Unit) {
          const unitReason = gameEffect.reason as EffectFromUnitDbObject
          const reasonEffectId = unitReason.effect.toString()
          if (!effectIds.includes(reasonEffectId)) {
            effectIds.push(reasonEffectId)
          }
          const reasonUnitId = unitReason.unit.toString()
          if (!unitIds.includes(reasonUnitId)) {
            unitIds.push(reasonUnitId)
          }
        } else if (gameEffect.reason.type === EffectReasonType.Leader) {
          const leaderReason = gameEffect.reason as EffectFromLeaderDbObject
          const reasonLeaderId = leaderReason.leader.toString()
          if (!leaderIds.includes(reasonLeaderId)) {
            leaderIds.push(reasonLeaderId)
          }
        } else {
          throw Error(`Invalid Effect Reason type "${gameEffect.reason.type}".`)
        }
      }

      if (effectIds.length > 0) {
        effects = await EffectResolver.fromIds(effectIds)
      }
      if (unitIds.length > 0) {
        unitsForEffects = await UnitResolver.fromIds({
          ids: unitIds,
        })
      }
      if (leaderIds.length > 0) {
        leaders = await LeaderResolver.fromIds({
          ids: leaderIds,
        })
      }
    }
    return {
      artStyle: gameUnit.artStyle,
      effectiveStrength: gameUnit.effectiveStrength,
      // TODO: split into own type resolver
      effects: gameUnit.effects?.map((gameUnitEffect) => {
        let reason: EffectReason | undefined = undefined
        if (gameUnitEffect.reason.type === EffectReasonType.Unit) {
          const unitReasonDbObject = gameUnitEffect.reason as EffectFromUnitDbObject
          const matchingEffect = effects.find((effect) => effect.id === unitReasonDbObject.effect.toString())
          const matchingUnit = unitsForEffects.find((unit) => unit.id === unitReasonDbObject.unit.toString())
          if (!matchingEffect) {
            throw Error('bad')
          }
          if (!matchingUnit) {
            throw Error('bad')
          }
          const unitReason: EffectFromUnit = {
            effect: matchingEffect,
            unit: matchingUnit,
            __typename: 'EffectFromUnit',
          }
          reason = unitReason
        } else if (gameUnitEffect.reason.type === EffectReasonType.Leader) {
          const leaderReasonDbObject = gameUnitEffect.reason as EffectFromLeaderDbObject
          const matchingLeader = leaders.find((leader) => leader.id === leaderReasonDbObject.leader.toString())
          if (!matchingLeader) {
            throw Error('baad')
          }
          const leaderReason: EffectFromLeader = {
            leader: matchingLeader,
            __typename: 'EffectFromLeader',
          }
          reason = leaderReason
        } else {
          throw Error('sdflk')
        }
        if (!reason) {
          throw Error('badder')
        }
        return {
          operator: gameUnitEffect.operator,
          reason,
          total: gameUnitEffect.total,
        }
      }),
      unit:
        unit ||
        (await UnitResolver.fromId({
          id: gameUnit.unit,
        })),
    }
  }

  /**
   * Converts an array of GameUnit database objects to an array of GameUnit GraphQL objects.
   *
   * @param config The configuration used to resolve the array of GameUnits.
   * @param gameUnits The database objects to resolve to their GraphQL types.
   * @returns The resolved GameUnit array matching the GraphQL schema definition.
   */
  static async fromArray({ gameUnits }: { gameUnits: GameUnitDbObject[] }): Promise<GameUnit[]> {
    if (gameUnits.length === 0) {
      return []
    }

    const units = await UnitResolver.fromIds({
      ids: gameUnits.map((gameUnit) => gameUnit.unit),
    })

    const resolvedGameUnits: GameUnit[] = []
    for (const gameUnit of gameUnits) {
      resolvedGameUnits.push(
        await GameUnitResolver.fromObject({
          gameUnit,
          unit: units.find((unit) => unit.id.toString() === gameUnit.unit.toString()),
        })
      )
    }

    return resolvedGameUnits
  }
}
