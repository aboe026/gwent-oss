import { resolveDlc, resolveEffects, resolveFaction } from './resolver-util'
import { UnitDbObject } from '@gwent/graphql-schema/database-typings'
import { UnitResolvers } from '@gwent/graphql-schema/resolver-typings'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const UnitResolver: UnitResolvers<any, UnitDbObject> = {
  dlc: async (unit: UnitDbObject) => resolveDlc(unit),
  effects: async (unit: UnitDbObject) => resolveEffects(unit),
  faction: async (unit: UnitDbObject) => resolveFaction(unit),
  id: (unit: UnitDbObject) => unit._id.toString(),
}

export default UnitResolver
