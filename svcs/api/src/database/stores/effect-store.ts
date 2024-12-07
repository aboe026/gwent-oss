import { Document, Filter, ObjectId } from 'mongodb'
import { getLogger } from 'log4js'

import { EffectDbObject, EffectKey } from '@gwent/graphql-schema/database-typings'
import Store from './store'

/**
 * Factory for possible effects Gwent units can have.
 */
export default class EffectStore extends Store {
  static readonly COLLECTION_NAME = 'effects'
  private static logger = getLogger('EffectStore')

  /**
   * Adds an Effect to the database.
   *
   * @param {Object} effect The Effect to add.
   * @param effect.ability The Ability the Effect possesses.
   * @param effect.image The icon representing the Effect.
   * @param effect.key The unique Key to identify the Effect.
   * @param effect.name The name of the Faction to add.
   * @returns The Effect database document.
   */
  static async add({ ability, image, key, name }: AddEffectInput): Promise<EffectDbObject> {
    EffectStore.logger.debug(`Adding effect with name "${name}"`)
    const effect: Document = {
      ability,
      created: new Date(),
      image,
      key,
      name,
    }
    if (EffectStore.logger.isTraceEnabled()) {
      EffectStore.logger.trace(`Adding effect: "${JSON.stringify(effect)}"`)
    }
    return EffectStore.create<EffectDbObject>(effect)
  }

  /**
   * Get all possible Effects a Unit can have.
   *
   * @param options The options to scope Effects to.
   * @param options.ids The ObjectIds to scope Effects to.
   * @param options.keys The keys to scope Effects to.
   * @returns Effects for Units.
   */
  static async get({ ids, keys }: GetEffectsInput): Promise<EffectDbObject[]> {
    if (EffectStore.logger.isDebugEnabled()) {
      EffectStore.logger.debug(`Getting effect with ids "${JSON.stringify(ids)}" and keys "${JSON.stringify(keys)}"`)
    }
    const filter: Filter<Document> = {}
    if (ids) {
      filter._id = {
        $in: ids.map((id) => new ObjectId(id)),
      }
    }
    if (keys) {
      filter.key = {
        $in: keys,
      }
    }
    if (EffectStore.logger.isTraceEnabled()) {
      EffectStore.logger.trace(`get filter: "${JSON.stringify(filter)}"`)
    }
    return EffectStore.read<EffectDbObject[]>({ filter })
  }
}

export interface AddEffectInput {
  ability: string
  image: string
  key: EffectKey
  name: string
}

export interface GetEffectsInput {
  ids?: (string | ObjectId)[]
  keys?: EffectKey[]
}
