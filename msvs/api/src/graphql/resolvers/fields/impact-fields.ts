import { Context } from '@gwent-oss/graphql-schema/context'
import { Impact, ImpactResolvers, Maybe, ResolversParentTypes } from '@gwent-oss/graphql-schema/resolver-typings'

export default class ImpactFields {
  static getFields():
    | ImpactResolvers<
        Context,
        Omit<Impact, 'unit'> & {
          unit?: Maybe<ResolversParentTypes['GameUnit']>
        }
      >
    | undefined {
    return {
      unit: (parent, args, context) => {
        const scopeId = parent.scope && parent.scope.id
        const contextUserId = context.session?.user?._id.toString()
        if (scopeId && contextUserId && scopeId !== contextUserId) {
          return null
        }
        return parent.unit || null
      },
    }
  }
}
