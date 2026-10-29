import { Document, Filter, ObjectId, UpdateFilter, WithoutId } from 'mongodb'
import { getLogger } from 'log4js'

import { EffectDbObject, EffectKey } from '@gwent-oss/graphql-schema/database-typings'
import Store from './store'

/**
 * Factory for possible Effects that Units can have.
 */
export default class EffectStore extends Store {
  static readonly COLLECTION_NAME = 'effects'
  private static logger = getLogger('EffectStore')

  /**
   * Adds an Effect to the database.
   *
   * @param config The configuration used to add the Effect.
   * @param config.ability The Ability the Effect possesses.
   * @param config.image The icon representing the Effect.
   * @param config.key The unique Key to identify the Effect.
   * @param config.name The name of the Effect to add.
   * @returns The Effect database document.
   */
  static async add({ ability, image, key, name }: AddEffectInput): Promise<EffectDbObject> {
    EffectStore.logger.debug(`Adding effect with name "${name}"`)
    const effect: WithoutId<EffectDbObject> = {
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
    return EffectStore.readMany<EffectDbObject[]>({ filter })
  }

  /**
   * Update an effect.
   *
   * @param options The options for the update.
   * @param options.id The ObjectId of the effect to update.
   * @param options.ability The ability to replace on the effect.
   * @returns The updated effect database document.
   */
  static async edit({ id, ability }: EditEffectInput): Promise<EffectDbObject> {
    EffectStore.logger.debug(`Editing effect with id "${id}"`)
    const filter: Filter<Document> = {
      _id: new ObjectId(id),
    }
    const update: UpdateFilter<Document> = {
      $set: {},
    }
    if (ability && update.$set) {
      update.$set.ability = ability
    }
    if (EffectStore.logger.isTraceEnabled()) {
      EffectStore.logger.trace(`edit filter for ID "${id}": "${JSON.stringify(filter)}"`)
      EffectStore.logger.trace(`edit update for ID "${id}": "${JSON.stringify(update)}"`)
    }
    return EffectStore.update({
      filter,
      update,
    })
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

export interface EditEffectInput {
  id: string | ObjectId
  ability?: string
}
