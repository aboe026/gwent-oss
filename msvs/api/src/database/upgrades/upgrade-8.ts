import { getLogger } from 'log4js'

import { Combat, Unit } from '@gwent-oss/graphql-schema/database-typings'
import EffectStore from '../stores/effect-store'
import FactionStore from '../stores/faction-store'
import { FactionUnits } from './upgrade-util'
import { GetUnitStats } from '@gwent-oss/utils'
import Upgrade from './upgrade'
import UnitStore from '../stores/unit-store'
import units from './resources/units.json'

/**
 * Increase occurrences of some Units to match correct number.
 */
export default class Upgrade8 extends Upgrade {
  static logger = getLogger('Upgrade8')

  /**
   * Run these upgrade operations against the database.
   */
  async run() {
    Upgrade8.logger.debug('Connecting to database')
    Upgrade8.logger.debug('Adding occurrences to Units')
    const factionUnitMap: FactionUnits = {}
    const existingUnits = await UnitStore.get({})

    let unitsAdded = 0
    for (const unit of units) {
      const existingOccurrences = existingUnits.filter((existingUnit) => existingUnit.name === unit.Name)
      Upgrade8.logger.trace(`Unit "${unit.Name}" found "${existingOccurrences}", desired "${unit.Occurrences}"`)
      for (let i = existingOccurrences.length; i < unit.Occurrences; i++) {
        Upgrade8.logger.debug(`Adding another instance of unit "${unit.Name}"`)
        unitsAdded++
        const existingOccurrence = existingOccurrences[0]
        if (!factionUnitMap[existingOccurrence.faction.toString()]) {
          factionUnitMap[existingOccurrence.faction.toString()] = []
        }
        factionUnitMap[existingOccurrence.faction.toString()].push(
          await UnitStore.add({
            ...existingOccurrence,
            combats: existingOccurrence.combats ? existingOccurrence.combats.map((combat) => combat as Combat) : [],
            dlc: existingOccurrence.dlc ? existingOccurrence.dlc : null,
            effects: existingOccurrence.effects || [],
            hero: Boolean(existingOccurrence.hero),
            effectPrefix: existingOccurrence.effectPrefix || null,
            scorchMin: existingOccurrence.scorchMin || null,
            scorchScope: existingOccurrence.scorchScope ? (existingOccurrence.scorchScope as Combat) : null,
            special: Boolean(existingOccurrence.special),
            strength: existingOccurrence.strength === undefined ? null : existingOccurrence.strength,
          })
        )
      }
    }

    if (unitsAdded) {
      const effects = await EffectStore.get({})
      for (const factionId of Object.keys(factionUnitMap)) {
        const factionUnits = [
          ...factionUnitMap[factionId],
          ...existingUnits.filter((existingUnit) => existingUnit.faction.toString() === factionId),
        ]
        await FactionStore.edit({
          id: factionId,
          stats: GetUnitStats.fromDeckUnits(
            factionUnits.map((factionUnit) => {
              factionUnit.effects = factionUnit.effects?.map((effectId) =>
                effects.find((effect) => effect._id.toString() === effectId.toString())
              ) as any // eslint-disable-line @typescript-eslint/no-explicit-any
              return {
                unit: factionUnit as any as Unit, // eslint-disable-line @typescript-eslint/no-explicit-any
                artStyle: 1,
              }
            })
          ),
        })
      }
    }
  }
}
