import { getLogger } from 'log4js'

import { GameUnitOrigin, Impact, TacoUnit, Unit, User } from '@gwent/graphql-schema/resolver-typings'
import GameUnitResolver from './game-unit-resolver'
import { GameUnitDbObject, ImpactDbObject } from '@gwent/graphql-schema/database-typings'
import ResolverUtil from '../resolver-util'
import { GameUnitType } from '@gwent/graphql-schema'
import DeckUnitResolver from './deck-unit-resolver'
import WeatherUnitResolver from './weather-unit-resolver'

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
   * @param config.units An optional pre-resolved Units. If not specified, will retreive the Units from the database to resolve.
   * @param config.users An optional pre-resolved Users. If not specified, will retreive the Users from the database to resolve.
   * @returns The resolved Impact object matching its GraphQL schema definition.
   */
  static async fromObject({
    impact,
    units,
    users,
  }: {
    impact: ImpactDbObject
    units?: Unit[]
    users?: User[]
  }): Promise<Impact> {
    const { units: resolvedUnits, users: resolvedUsers } = await ResolverUtil.resolveUsersAndUnits({
      impacts: [impact],
      presolvedUsers: users,
      presolvedUnits: units,
    })

    const impactUnit = resolvedUnits.find((unit) => unit.id === impact.unit?.unit.toString())
    if (impact.unit && !impactUnit) {
      const message = `Could not find impact unit "${impact.unit.unit}"`
      ImpactResolver.logger.error(`${message}, impact: "${JSON.stringify(impact)}"`)
      throw Error(`${message}.`)
    }

    const impactUser = resolvedUsers.find((user) => user.id === impact.user.toString())
    if (!impactUser) {
      const message = `Could not find impact user "${impact.user}"`
      ImpactResolver.logger.error(`${message}, impact: "${JSON.stringify(impact)}"`)
      throw Error(`${message}.`)
    }
    let sourceUser: User | undefined = undefined
    if (impact.source?.user) {
      sourceUser = resolvedUsers.find((user) => user.id === impact.source?.user?.toString())
      if (!sourceUser) {
        const message = `Could not find impact source user "${impact.source.user}"`
        ImpactResolver.logger.error(`${message}, impact: "${JSON.stringify(impact)}"`)
        throw Error(`${message}.`)
      }
    }

    let unit: TacoUnit | undefined
    if (impact.unit?.type === GameUnitType.Deck) {
      unit = await DeckUnitResolver.fromObject({
        deckUnit: impact.unit,
        unit: impactUnit,
      })
    } else if (impact.unit?.type === GameUnitType.Field) {
      unit = await GameUnitResolver.fromObject({
        gameUnit: impact.unit as GameUnitDbObject,
        unit: impactUnit,
      })
    } else if (impact.unit?.type === GameUnitType.Weather) {
      unit = await WeatherUnitResolver.fromObject({
        weatherUnit: impact.unit,
        unit: impactUnit,
      })
    }

    return {
      unit,
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
   * @param config.units An optional pre-resolved Units. If not specified, will retreive the Units from the database to resolve.
   * @param config.users An optional pre-resolved Users. If not specified, will retreive the Users from the database to resolve.
   * @returns The resolved Impact array matching the GraphQL schema definition.
   */
  static async fromArray({
    impacts,
    units,
    users,
  }: {
    impacts: ImpactDbObject[] | undefined
    units?: Unit[]
    users?: User[]
  }): Promise<Impact[] | undefined> {
    if (ImpactResolver.logger.isTraceEnabled()) {
      ImpactResolver.logger.trace(`impacts: "${JSON.stringify(impacts)}"`)
    }
    if (impacts) {
      const resolvedImpacts: Impact[] = []
      const { units: resolvedUnits, users: resolvedUsers } = await ResolverUtil.resolveUsersAndUnits({
        impacts,
        presolvedUnits: units,
        presolvedUsers: users,
      })
      if (ImpactResolver.logger.isTraceEnabled()) {
        ImpactResolver.logger.trace(`resolvedUnits: "${JSON.stringify(resolvedUnits)}"`)
        ImpactResolver.logger.trace(`resolvedUsers: "${JSON.stringify(resolvedUsers)}"`)
      }

      for (const impact of impacts) {
        resolvedImpacts.push(
          await ImpactResolver.fromObject({
            impact,
            units: resolvedUnits,
            users: resolvedUsers,
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
