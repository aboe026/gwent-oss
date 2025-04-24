import { getLogger } from 'log4js'

import { EffectDbObject, EffectKey } from '@gwent/graphql-schema/database-typings'

export default class GetEffectWithKey {
  private static logger = getLogger('GetEffectWithKey')

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
