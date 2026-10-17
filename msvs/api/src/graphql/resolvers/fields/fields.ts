import ImpactFields from './impact-fields'
import { Resolvers } from '@gwent-oss/graphql-schema/resolver-typings'

/**
 * A class to resolve Fields on schema object types.
 */
export default class Fields {
  /**
   * Gets all the schema object types whose field values should be overridden.
   *
   * @returns The schema object types with their field override definitions.
   */
  static getFields(): Resolvers {
    return {
      Impact: ImpactFields.getFields(),
    }
  }
}
