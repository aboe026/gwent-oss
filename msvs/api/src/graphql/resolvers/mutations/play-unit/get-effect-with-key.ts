import { getLogger } from 'log4js'

import { EffectDbObject, EffectKey } from '@gwent/graphql-schema/database-typings'

/**
 * A class for retrieving an effect with a specific key from a list of effect database objects.
 */
export default class GetEffectWithKey {
  private static logger = getLogger('GetEffectWithKey')

  /**
   * Gets an effect with a specific key from a list of database effect objects, if it exists.
   *
   * @param config The configuration for retrieving the effect with a specific key.
   * @param config.effectKey The EffectKey to look for in the list of effect database documents.
   * @param config.effects The list of Effect database documents, among which one may have a key matching effectKey.
   * @param config.logPrefix What to prepend to log output statements.
   * @returns An Effect database document with the desired EffectKey, or undefined if one does not exist in the list of effects.
   */
  static getEffectWithKey({
    effectKey,
    effects,
    logPrefix,
  }: {
    effectKey: EffectKey
    effects: EffectDbObject[]
    logPrefix: string
  }): EffectDbObject | undefined {
    if (GetEffectWithKey.logger.isTraceEnabled()) {
      GetEffectWithKey.logger.trace(`${logPrefix} effectKey: "${effectKey}", effects: "${JSON.stringify(effects)}"`)
    }
    if (effects.length > 0) {
      const effectsWithKey = effects.filter((effect) => effect.key === effectKey.toString())
      if (effectsWithKey.length > 1) {
        const message = `Found more than 1 effect with key "${effectKey}"`
        GetEffectWithKey.logger.error(`${message}: ${JSON.stringify(effectsWithKey)}`)
        throw Error(message)
      }
      return effectsWithKey[0]
    }
  }
}
