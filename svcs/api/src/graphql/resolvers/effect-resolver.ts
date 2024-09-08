import { getLogger } from 'log4js'

import { EffectDbObject } from '@gwent/graphql-schema/database-typings'
import { Effect, EffectKey } from '@gwent/graphql-schema/resolver-typings'
import { ObjectId } from 'mongodb'
import EffectStore from '../../database/stores/effect-store'
import Verifier from '../../util/verify-objects'

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

  static async resolveFromIds(ids: (string | ObjectId)[]): Promise<Effect[]> {
    const effects =
      ids.length === 0
        ? []
        : await EffectStore.get({
            ids: ids,
          })

    Verifier.checkObjects({
      expectedKeys: ids,
      objects: effects,
      field: '_id',
      logger: EffectResolver.logger,
      resourceLabelPlural: 'effects',
    })

    return effects.map((effect) => EffectResolver.resolveFromObject(effect))
  }
}
