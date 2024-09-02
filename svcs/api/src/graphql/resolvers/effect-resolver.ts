import { getLogger } from 'log4js'

import { EffectDbObject } from '@gwent/graphql-schema/database-typings'
import { Effect, EffectKey } from '@gwent/graphql-schema/resolver-typings'
import { ObjectId } from 'mongodb'
import EffectStore from '../../database/stores/effect-store'

export default class EffectResolver {
  private static logger = getLogger('effect-resolver')

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

  static async resolveFromIds(ids?: (string | ObjectId)[]): Promise<Effect[] | null> {
    if (ids) {
      if (ids.length === 0) {
        return []
      }
      const effects = await EffectStore.get({
        ids: ids,
      })
      const resolvedEffects: Effect[] = []
      for (const id of ids) {
        const effect = effects.find((effect) => effect._id.toString() === id.toString())
        if (!effect) {
          // TODO: make sure always verifying
          // that all ids/objects actually returned
          const messsage = `Could not resolve effect "${id}".`
          EffectResolver.logger.error(messsage)
          throw Error(messsage)
        }
        resolvedEffects.push(EffectResolver.resolveFromObject(effect))
      }
      return resolvedEffects
    }
    return null
  }
}
