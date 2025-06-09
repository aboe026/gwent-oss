import { ImpactDbObject } from '@gwent/graphql-schema/database-typings'
import { Impact } from '@gwent/graphql-schema/resolver-typings'
import GameUnitResolver from './game-unit-resolver'
import UserResolver from './user-resolver'

export default class MoveImpactsResolver {
  static async fromObject({ impacts }: { impacts: ImpactDbObject[] | undefined }): Promise<Impact[] | undefined> {
    if (impacts) {
      const resolvedImpacts: Impact[] = []
      const gameUnits = await GameUnitResolver.fromArray({
        gameUnits: impacts?.map((impact) => impact.unit),
      })
      const users = await UserResolver.fromIds(impacts.map((impact) => impact.user))
      for (const impact of impacts) {
        const matchingGameUnits = gameUnits.filter((gameUnit) => gameUnit.unit.id === impact.unit.unit.toString())
        if (matchingGameUnits.length === 0) {
          throw Error(`Could not find game unit with ID "${impact.unit.unit}" for move Impact.`)
        } else if (matchingGameUnits.length > 1) {
          throw Error(`Found more than 1 game unit with ID "${impact.unit.unit}" for move Impact.`)
        }
        const matchingUsers = users.filter((user) => user.id === impact.user.toString())
        if (matchingUsers.length === 0) {
          throw Error(`Could not find user with ID "${impact.user}" for move Impact.`)
        } else if (matchingUsers.length > 1) {
          throw Error(`Found more than 1 user with ID "${impact.user}" for move Impact.`)
        }
        resolvedImpacts.push({
          unit: matchingGameUnits[0],
          user: matchingUsers[0],
        })
      }
      return resolvedImpacts
    }
  }
}
