import FieldUnitResolver from './field-unit-resolver'
import { PlayerCombatRow, Unit } from '@gwent/graphql-schema/resolver-typings'
import { PlayerCombatRowDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * A class to convert PlayerCombatRow database objects to their GraphQL equivalent.
 */
export default class CombatRowResolver {
  /**
   * Converts a single PlayerCombatRow database object to a single PlayerCombatRow GraphQL object.
   *
   * @param config The configuration for resolving the PlayerCombatRow.
   * @param config.row The database object to resolve to its GraphQL type.
   * @param config.units An optional pre-resolved Units. If not specified, will retreive the Units from the database to resolve.
   * @returns The resolved PlayerRound object matching its GraphQL schema definition.
   */
  static async fromObject({ row, units }: { row: PlayerCombatRowDbObject; units: Unit[] }): Promise<PlayerCombatRow> {
    return {
      score: row.score,
      units: await FieldUnitResolver.fromArray({
        fieldUnits: row.units,
        units,
      }),
      modifier: row.modifier
        ? await FieldUnitResolver.fromObject({
            fieldUnit: row.modifier,
            unit: units.find((unit) => unit.id === row.modifier?.unit.toString()),
          })
        : undefined,
    }
  }
}
