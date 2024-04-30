import { Document, Filter, ObjectId } from 'mongodb'
import { getLogger } from 'log4js'

import { EffectDbObject, EffectKey, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import { prettyPrintList, toTitleCase } from '../../util/string-util'
import Store from './store'

/**
 * Factory for possible effects Gwent cards can have.
 */
export default class EffectStore extends Store {
  static readonly COLLECTION_NAME = 'effects'
  private static logger = getLogger('effect-store')

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
   * Get all possible Effects a Card can have.
   *
   * @param options The options to scope Effects to.
   * @param options.ids The ObjectIds to scope Effects to.
   * @param options.keys The keys to scope Effects to.
   * @returns Effects for cards.
   */
  static async get({ ids, keys }: GetEffectsInput): Promise<EffectDbObject[]> {
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
    return EffectStore.read<EffectDbObject[]>({ filter })
  }

  /**
   * Resolves the abilities on effects for a unit to be more specific.
   *
   * @param unit The unit containing the effects.
   * @param effects The effects whose abilities will be resolved for specificity.
   * @returns The effect with more specific abilities.
   */
  static resolveAbilitiesForUnit(unit: UnitDbObject, effects: EffectDbObject[]): EffectDbObject[] {
    return effects.map((effect) => {
      let ability = effect.ability
      if (effect.key === EffectKey.Weather && unit.combats && unit.combats.length > 0) {
        ability = effect.ability.replace(
          'given row(s)',
          prettyPrintList({
            items: unit.combats.map((combat) => toTitleCase(combat)),
            labelPlural: 'rows',
            labelSingular: 'row',
          })
        )
      } else if (effect.key === EffectKey.Muster && unit.effectPrefix) {
        ability = effect.ability.replace('same name', `"${unit.effectPrefix}" prefix`)
      }
      return {
        ...effect,
        ability,
      }
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
