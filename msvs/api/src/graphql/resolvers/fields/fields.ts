import ImpactFields from './impact-fields'
import { Resolvers } from '@gwent-oss/graphql-schema/resolver-typings'

export default class Fields {
  static getFields(): Resolvers {
    return {
      Impact: ImpactFields.getFields(),
    }
  }
}
