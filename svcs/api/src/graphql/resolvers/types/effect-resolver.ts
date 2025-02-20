import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Effect, EffectKey } from '@gwent/graphql-schema/resolver-typings'
import { EffectDbObject } from '@gwent/graphql-schema/database-typings'
import EffectStore from '../../../database/stores/effect-store'
import Verifier from '../../../util/verifier'

/**
 * A class to convert Effect database objects to their GraphQL equivalent.
 */
export default class EffectResolver {
  private static logger = getLogger('EffectResolver')

  /**
   * Converts a single Effect database object to a single Effect GraphQL object.
   *
   * @param effect The Effect database object to convert.
   * @returns The resolved Effect object matching its GraphQL schema definition.
   */
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

  /**
   * Retrieves Effects with the given IDs and converts them to their GraphQL object equivalents.
   *
   * @param ids The ObjectIds of the Effects to convert.
   * @returns The resolved Effects array for the given IDs.
   * @throws Error if a Effect with the given IDs does not exist.
   */
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

  static async fromId(id: string | ObjectId): Promise<Effect> {
    const effects = await EffectResolver.fromIds([id])
    return effects[0]
  }
}
