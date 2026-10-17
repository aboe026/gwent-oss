import { Context } from '@gwent-oss/graphql-schema/context'
import { Impact, ImpactResolvers, Maybe, ResolversParentTypes } from '@gwent-oss/graphql-schema/resolver-typings'

/**
 * A class for resolving the fields on the Impact type.
 */
export default class ImpactFields {
  /**
   * Gets overwrites for how fields should be returned on the Impact object.
   *
   * @returns Fields on the Impact object and methods for overwriting how they should be returned
   */
  static getFields():
    | ImpactResolvers<
        Context,
        Omit<Impact, 'unit'> & {
          unit?: Maybe<ResolversParentTypes['GameUnit']>
        }
      >
    | undefined {
    return {
      unit: (parent, args, context) =>
        ImpactFields.getUnit({
          parent,
          context,
        }),
    }
  }

  /**
   * Gets the Unit for an Impact. Returns null if the user does not have access to it by not being in scope for it.
   *
   * @param config The configuration used to get the Unit for the Impact.
   * @param config.parent The Impact object which contains the unit.
   * @param config.context The user requesting the Impact.
   * @returns The Unit for the Impact, or null if user requesting is not in scope.
   */
  private static getUnit({ parent, context }: ImpactFieldGetUnitInput): Maybe<ResolversParentTypes['GameUnit']> {
    const scopeId = parent.scope && parent.scope.id
    const contextUserId = context.session?.user?._id.toString()
    if (scopeId && contextUserId && scopeId !== contextUserId) {
      return null
    }
    return parent.unit || null
  }
}

export interface ImpactFieldGetUnitInput {
  parent: Omit<Impact, 'unit'> & {
    unit?: Maybe<ResolversParentTypes['GameUnit']>
  }
  context: Context
}

export type ImpactFieldGetUnitOutput = Maybe<ResolversParentTypes['GameUnit']>
