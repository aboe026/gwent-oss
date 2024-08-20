import { EffectDbObject } from '@gwent/graphql-schema/database-typings'
import { Effect, EffectKey } from '@gwent/graphql-schema/resolver-typings'
import { ObjectId } from 'mongodb'
import EffectStore from '../../database/stores/effect-store'

export default class EffectResolver {
  static resolveFromObject(effect: EffectDbObject): Effect {
    return {
      ability: effect.ability,
      created: effect.created,
      id: effect._id.toString(),
      image: effect.image,
      key: effect.key as EffectKey,
      name: effect.name,
    }
  }

  static async resolveFromIds(effectIds?: (string | ObjectId)[]): Promise<Effect[] | null> {
    if (effectIds) {
      const effects = await EffectStore.get({
        ids: effectIds,
      })
      return effects.map((effect) => EffectResolver.resolveFromObject(effect))
    }
    return null
  }
}
