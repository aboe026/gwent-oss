import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import GameUnitResolver from './game-unit-resolver'
import { GameUnit, GameUnitOrigin, Impact, User } from '@gwent/graphql-schema/resolver-typings'
import { ImpactDbObject } from '@gwent/graphql-schema/database-typings'
import UnitResolver from './unit-resolver'
import UserResolver from './user-resolver'

/**
 * A class to convert Impact database objects to their GraphQL equivalent.
 */
export default class ImpactResolver {
  private static logger = getLogger('ImpactResolver')

  /**
   * Converts a single Impact database object to a single Impact GraphQL object.
   *
   * @param config The configuration used to convert the Impact.
   * @param config.impact The Impact to convert.
   * @param config.gameUnit The resolved GameUnit for the Impact. If not provided, will be retrieved.
   * @param config.user The resolved User for the Impact. If not provided, will be retrieved.
   * @returns The resolved Impact object matching its GraphQL schema definition.
   */
  static async fromObject({
    impact,
    gameUnit,
    user,
  }: {
    impact: ImpactDbObject
    gameUnit?: GameUnit
    user?: User
  }): Promise<Impact> {
    const users: User[] = []
    const userIds: ObjectId[] = []
    if (user) {
      users.push(user)
    } else {
      userIds.push(impact.user)
    }
    if (impact.source?.user) {
      userIds.push(impact.source.user)
    }

    if (userIds.length > 0) {
      users.push(...(await UserResolver.fromIds(userIds)))
    }
    const impactUser = users.find((user) => user.id === impact.user.toString())
    if (!impactUser) {
      const message = `Could not find impact user "${impact.user}"`
      ImpactResolver.logger.error(`failed: ${message}, impact: "${JSON.stringify(impact)}"`)
      throw Error(`${message}.`)
    }
    let sourceUser: User | undefined = undefined
    if (impact.source?.user) {
      sourceUser = users.find((user) => user.id === impact.source?.user?.toString())
      if (!sourceUser) {
        const message = `Could not find impact source user "${impact.source.user}"`
        ImpactResolver.logger.error(`failed: ${message}, impact: "${JSON.stringify(impact)}"`)
        throw Error(`${message}.`)
      }
    }
    return {
      unit:
        gameUnit ||
        (await GameUnitResolver.fromObject({
          gameUnit: impact.unit,
        })),
      user: impactUser,
      source: impact.source
        ? {
            origin: impact.source.origin as GameUnitOrigin,
            user: sourceUser,
          }
        : undefined,
    }
  }

  /**
   * Converts an array of Impact database objects to an array of Impact GraphQL objects.
   *
   * @param config The configuration used to convert the array.
   * @param config.impacts The array of Impact database objects to convert.
   * @returns The resolved Impact array matching the GraphQL schema definition.
   */
  static async fromArray({ impacts }: { impacts: ImpactDbObject[] | undefined }): Promise<Impact[] | undefined> {
    if (ImpactResolver.logger.isTraceEnabled()) {
      ImpactResolver.logger.trace(`impacts: "${JSON.stringify(impacts)}"`)
    }
    if (impacts) {
      const resolvedImpacts: Impact[] = []
      const units = await UnitResolver.fromIds({
        ids: impacts.map((impact) => impact.unit.unit),
      })
      if (ImpactResolver.logger.isTraceEnabled()) {
        ImpactResolver.logger.trace(`units: "${JSON.stringify(units)}"`)
      }

      const users = await UserResolver.fromIds(impacts.map((impact) => impact.user))
      if (ImpactResolver.logger.isTraceEnabled()) {
        ImpactResolver.logger.trace(`users: "${JSON.stringify(users)}"`)
      }

      for (const impact of impacts) {
        if (ImpactResolver.logger.isTraceEnabled()) {
          ImpactResolver.logger.trace(`impact: "${JSON.stringify(impact)}"`)
        }
        const matchingUnits = units.filter((unit) => unit.id === impact.unit.unit.toString())
        if (ImpactResolver.logger.isTraceEnabled()) {
          ImpactResolver.logger.trace(`matchingUnits: "${JSON.stringify(matchingUnits)}"`)
        }

        if (matchingUnits.length === 0) {
          const message = `Could not find unit with ID "${impact.unit.unit}" for move Impact`
          ImpactResolver.logger.error(`${message}, impact: "${JSON.stringify(impact)}"`)
          throw Error(`${message}.`)
        } else if (matchingUnits.length > 1) {
          const message = `Found more than 1 unit with ID "${impact.unit.unit}" for move Impact`
          ImpactResolver.logger.error(
            `${message}, impact: "${JSON.stringify(impact)}", matchingUnits "${JSON.stringify(matchingUnits)}"`
          )
          throw Error(`${message}.`)
        }
        const matchingUsers = users.filter((user) => user.id === impact.user.toString())
        if (ImpactResolver.logger.isTraceEnabled()) {
          ImpactResolver.logger.trace(`matchingUsers: "${JSON.stringify(matchingUsers)}"`)
        }
        if (matchingUsers.length === 0) {
          const message = `Could not find user with ID "${impact.user}" for move Impact`
          ImpactResolver.logger.error(`${message}, impact: "${JSON.stringify(impact)}"`)
          throw Error(`${message}.`)
        } else if (matchingUsers.length > 1) {
          const message = `Found more than 1 user with ID "${impact.user}" for move Impact`
          ImpactResolver.logger.error(
            `${message}, impact: "${JSON.stringify(impact)}", matchingUsers: "${JSON.stringify(matchingUsers)}"`
          )
          throw Error(`${message}.`)
        }
        resolvedImpacts.push(
          await ImpactResolver.fromObject({
            impact,
            gameUnit: await GameUnitResolver.fromObject({
              gameUnit: impact.unit,
              unit: matchingUnits[0],
            }),
            user: matchingUsers[0],
          })
        )
      }

      if (ImpactResolver.logger.isTraceEnabled()) {
        ImpactResolver.logger.trace(`resolvedImpacts: "${JSON.stringify(resolvedImpacts)}"`)
      }
      return resolvedImpacts
    }
  }
}
