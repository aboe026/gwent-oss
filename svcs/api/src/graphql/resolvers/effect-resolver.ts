import { EffectDbObject } from '@gwent/graphql-schema/database-typings'
import { EffectResolvers } from '@gwent/graphql-schema/resolver-typings'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EffectResolver: EffectResolvers<any, EffectDbObject> = {
  id: (effect: EffectDbObject) => effect._id.toString(),
}

export default EffectResolver
