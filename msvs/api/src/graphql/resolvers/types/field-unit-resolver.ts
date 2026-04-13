import { Combat, FieldUnit, Unit } from '@gwent/graphql-schema/resolver-typings'
import { FieldUnitDbObject } from '@gwent/graphql-schema/database-typings'
import FieldUnitEffectResolver from './field-unit-effect-resolver'
import UnitResolver from './unit-resolver'

/**
 * A class to convert FieldUnit database objects to their GraphQL equivalent.
 */
export default class FieldUnitResolver {
  /**
   * Converts a single FieldUnit database object to a single FieldUnit GraphQL object.
   *
   * @param config The configuration to use when resolving the FieldUnit object.
   * @param config.fieldUnit The database object to resolve to its GraphQL type.
   * @param config.unit An optional pre-resolved unit. If not specified, will retreive the Unit from the database to resolve.
   * @returns The resolved FieldUnit object matching its GraphQL schema definition.
   */
  static async fromObject({ fieldUnit, unit }: { fieldUnit: FieldUnitDbObject; unit?: Unit }): Promise<FieldUnit> {
    return {
      artStyle: fieldUnit.artStyle,
      effectiveStrength: fieldUnit.effectiveStrength,
      effects: await FieldUnitEffectResolver.fromArray({
        fieldUnitEffects: fieldUnit.effects,
      }),
      row: fieldUnit.row as Combat,
      unit:
        unit ||
        (await UnitResolver.fromId({
          id: fieldUnit.unit,
        })),
      __typename: 'FieldUnit',
    }
  }

  /**
   * Converts an array of FieldUnit database objects to an array of FieldUnit GraphQL objects.
   *
   * @param config The configuration used to resolve the array of FieldUnits.
   * @param config.fieldUnits The database objects to resolve to their GraphQL types.
   * @param config.units The resolved Units for the FieldUnits. If not provided, will be retrieved.
   * @returns The resolved FieldUnit array matching the GraphQL schema definition.
   */
  static async fromArray({
    fieldUnits,
    units,
  }: {
    fieldUnits: FieldUnitDbObject[]
    units?: Unit[]
  }): Promise<FieldUnit[]> {
    if (fieldUnits.length === 0) {
      return []
    }

    let resolvedUnits: Unit[]
    if (units) {
      resolvedUnits = units
    } else {
      resolvedUnits = await UnitResolver.fromIds({
        ids: fieldUnits.map((fieldUnit) => fieldUnit.unit),
      })
    }

    const resolvedFieldUnits: FieldUnit[] = []
    for (const fieldUnit of fieldUnits) {
      resolvedFieldUnits.push(
        await FieldUnitResolver.fromObject({
          fieldUnit: fieldUnit,
          unit: resolvedUnits.find((unit) => unit.id.toString() === fieldUnit.unit.toString()),
        })
      )
    }

    return resolvedFieldUnits
  }
}
