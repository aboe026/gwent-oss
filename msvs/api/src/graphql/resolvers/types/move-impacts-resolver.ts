import { getLogger } from 'log4js'

import GameUnitResolver from './game-unit-resolver'
import { Impact } from '@gwent/graphql-schema/resolver-typings'
import { ImpactDbObject } from '@gwent/graphql-schema/database-typings'
import UnitResolver from './unit-resolver'
import UserResolver from './user-resolver'

export default class MoveImpactsResolver {
  private static logger = getLogger('MoveImpactResolver')

  static async fromObject({ impacts }: { impacts: ImpactDbObject[] | undefined }): Promise<Impact[] | undefined> {
    if (MoveImpactsResolver.logger.isTraceEnabled()) {
      MoveImpactsResolver.logger.trace(`impacts: "${JSON.stringify(impacts)}"`)
    }
    if (impacts) {
      const resolvedImpacts: Impact[] = []

      const units = await UnitResolver.fromIds({
        ids: impacts.map((impact) => impact.unit.unit),
      })
      if (MoveImpactsResolver.logger.isTraceEnabled()) {
        MoveImpactsResolver.logger.trace(`units: "${JSON.stringify(units)}"`)
      }

      const users = await UserResolver.fromIds(impacts.map((impact) => impact.user))
      if (MoveImpactsResolver.logger.isTraceEnabled()) {
        MoveImpactsResolver.logger.trace(`users: "${JSON.stringify(users)}"`)
      }

      for (const impact of impacts) {
        if (MoveImpactsResolver.logger.isTraceEnabled()) {
          MoveImpactsResolver.logger.trace(`impact: "${JSON.stringify(impact)}"`)
        }
        const matchingUnits = units.filter((unit) => unit.id === impact.unit.unit.toString())
        if (MoveImpactsResolver.logger.isTraceEnabled()) {
          MoveImpactsResolver.logger.trace(`matchingUnits: "${JSON.stringify(matchingUnits)}"`)
        }

        if (matchingUnits.length === 0) {
          const message = `Could not find unit with ID "${impact.unit.unit}" for move Impact.`
          MoveImpactsResolver.logger.error(`${message}: impact "${JSON.stringify(impact)}"`)
          throw Error(message)
        } else if (matchingUnits.length > 1) {
          const message = `Found more than 1 unit with ID "${impact.unit.unit}" for move Impact.`
          MoveImpactsResolver.logger.error(
            `${message}: impact "${JSON.stringify(impact)}", matchingUnits "${JSON.stringify(matchingUnits)}"`
          )
          throw Error(message)
        }
        const matchingUsers = users.filter((user) => user.id === impact.user.toString())
        if (matchingUsers.length === 0) {
          const message = `Could not find user with ID "${impact.user}" for move Impact.`
          MoveImpactsResolver.logger.error(`${message}: impact: "${JSON.stringify(impact)}"`)
          throw Error(message)
        } else if (matchingUsers.length > 1) {
          const message = `Found more than 1 user with ID "${impact.user}" for move Impact.`
          MoveImpactsResolver.logger.error(
            `${message}: impact: "${JSON.stringify(impact)}", matchingUsers: "${JSON.stringify(matchingUsers)}"`
          )
          throw Error(message)
        }
        resolvedImpacts.push({
          unit: await GameUnitResolver.fromObject({
            gameUnit: impact.unit,
            unit: matchingUnits[0],
          }),
          user: matchingUsers[0],
        })
      }
      return resolvedImpacts
    }
  }
}
