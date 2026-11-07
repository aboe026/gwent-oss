import { UnitDbObject } from '@gwent-oss/graphql-schema/database-typings'

export interface FactionUnits {
  [x: string]: UnitDbObject[]
}
