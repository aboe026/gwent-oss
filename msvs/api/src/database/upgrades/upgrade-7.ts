import { getLogger } from 'log4js'

import effects from './resources/effects.json'
import EffectStore from '../stores/effect-store'
import factions from './resources/factions.json'
import FactionStore from '../stores/faction-store'
import leaders from './resources/leaders.json'
import LeaderStore from '../stores/leader-store'
import Upgrade from './upgrade'

/**
 * Updates ability text for Effects, Factions and Leaders.
 */
export default class Upgrade7 extends Upgrade {
  static logger = getLogger('Upgrade7')

  /**
   * Run these upgrade operations against the database.
   */
  async run() {
    Upgrade7.logger.debug('Connecting to database')
    Upgrade7.logger.debug('Updating ability text for Effects')
    await Upgrade7.updateAbilities({
      label: 'effect',
      store: EffectStore,
      newResources: effects,
    })
    Upgrade7.logger.debug('Updating ability text for Factions')
    await Upgrade7.updateAbilities({
      label: 'faction',
      store: FactionStore,
      newResources: factions,
    })
    Upgrade7.logger.debug('Updating ability text for Leaders')
    await Upgrade7.updateAbilities({
      label: 'leader',
      store: LeaderStore,
      newResources: leaders,
    })
  }

  /**
   * Update the abilities text for a given resource.
   *
   * @param config The configuration used to update the abilities for the resources.
   * @param config.store The Store for the resource to interact with the database.
   * @param config.newResources The JSON file containing new definitions for the resource.
   * @param config.label What to label log statements with.
   */
  private static async updateAbilities({
    store,
    newResources,
    label,
  }: {
    store: typeof EffectStore | typeof FactionStore | typeof LeaderStore
    newResources: {
      Name: string
      Ability?: string | undefined
    }[]
    label: string
  }) {
    const oldResources = await store.get({})
    if (Upgrade7.logger.isTraceEnabled()) {
      Upgrade7.logger.trace(`oldResources for "${label}": "${JSON.stringify(oldResources)}"`)
    }
    for (const oldResource of oldResources) {
      const newResource = newResources.find((newResource) => newResource.Name === oldResource.name)
      if (!newResource) {
        const message = `Could not find current ${label} definition for database ${label} with name "${oldResource}"`
        Upgrade7.logger.error(`${message}, ${label}s: "${JSON.stringify(factions)}"`)
        throw Error(message)
      }
      if (oldResource.ability !== newResource.Ability) {
        Upgrade7.logger.trace(`Updating ${label} "${oldResource._id}" to have ability text "${newResource.Ability}"`)
        await store.edit({
          id: oldResource._id,
          ability: newResource.Ability,
        })
      } else {
        Upgrade7.logger.trace(
          `Not updating ${label} ability for "${oldResource._id}" since old ability "${oldResource.ability}" matches new ability "${newResource.Ability}"`
        )
      }
    }
  }
}
