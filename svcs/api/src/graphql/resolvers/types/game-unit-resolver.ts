import { GameUnit, Unit } from '@gwent/graphql-schema/resolver-typings'
import { GameUnitDbObject } from '@gwent/graphql-schema/database-typings'
import UnitResolver from './unit-resolver'

export default class GameUnitResolver {
  static async fromObject({ gameUnit, unit }: { gameUnit: GameUnitDbObject; unit?: Unit }): Promise<GameUnit> {
    return {
      artStyle: gameUnit.artStyle,
      effectiveStrength: gameUnit.effectiveStrength,
      unit:
        unit ||
        (await UnitResolver.fromId({
          id: gameUnit.unit,
        })),
    }
  }

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
