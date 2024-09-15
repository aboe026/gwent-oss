import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Effect, EffectKey } from '@gwent/graphql-schema/resolver-typings'
import { EffectDbObject } from '@gwent/graphql-schema/database-typings'
import EffectStore from '../../database/stores/effect-store'
import Verifier from '../../util/verifier'

export default class EffectResolver {
  private static logger = getLogger('effect-resolver')

  static fromObject(effect: EffectDbObject): Effect {
    return {
      ability: effect.ability,
      created: effect.created,
      id: effect._id.toString(),
      image: effect.image,
      key: effect.key as EffectKey,
      name: effect.name,
    }
  }

  static async fromIds(ids: (string | ObjectId)[]): Promise<Effect[]> {
    if (ids.length === 0) {
      return []
    }

    const effects = await EffectStore.get({
      ids: ids,
    })

    Verifier.checkObjects({
      expectedKeys: ids,
      objects: effects,
      field: '_id',
      logger: EffectResolver.logger,
      label: 'effects',
    })

    return effects.map((effect) => EffectResolver.fromObject(effect))
  }
}
