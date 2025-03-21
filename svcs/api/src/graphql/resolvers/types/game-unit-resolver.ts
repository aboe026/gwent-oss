import { GameUnit, Unit } from '@gwent/graphql-schema/resolver-typings'
import { GameUnitDbObject } from '@gwent/graphql-schema/database-typings'
import GameUnitEffectResolver from './game-unit-effect-resolver'
import UnitResolver from './unit-resolver'

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
    return {
      artStyle: gameUnit.artStyle,
      effectiveStrength: gameUnit.effectiveStrength,
      effects: await GameUnitEffectResolver.fromArray({
        gameUnitEffects: gameUnit.effects,
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
