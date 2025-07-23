import { getLogger } from 'log4js'

import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  ImpactDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import GetEffectWithKey from './get-effect-with-key'
import UnitStore from '../../../../database/stores/unit-store'

export default class MusterBattlefield {
  private static logger = getLogger('MusterBattlefield')

  static async musterBattlefield({
    battlefieldUnits,
    effects,
    game,
    logPrefix,
    newDeckUnit,
  }: {
    battlefieldUnits: UnitDbObject[]
    effects: EffectDbObject[]
    game: GameDbObject
    logPrefix: string
    newDeckUnit: DeckUnitDbObject
  }): Promise<{
    impacts: ImpactDbObject[] | undefined
    musteredUnits: UnitDbObject[]
  }> {
    const impacts: ImpactDbObject[] = []
    const musteredUnits: UnitDbObject[] = []

    const newUnit = battlefieldUnits.find((unit) => unit._id.toString() === newDeckUnit.unit.toString())
    if (!newUnit) {
      const message = `Could not find unit for new deck unit "${newDeckUnit.unit}".`
      MusterBattlefield.logger.error(`${logPrefix} failed: ${message}`)
      throw Error(message)
    }
    if (MusterBattlefield.logger.isTraceEnabled()) {
      MusterBattlefield.logger.trace(`${logPrefix} newUnit: "${JSON.stringify(newUnit)}"`)
    }

    const musterEffect = GetEffectWithKey.getEffectWithKey({
      effectKey: EffectKey.Muster,
      effects,
      logPrefix,
    })
    if (MusterBattlefield.logger.isTraceEnabled()) {
      MusterBattlefield.logger.trace(`${logPrefix} musterEffect: "${JSON.stringify(musterEffect)}"`)
    }
    const hasMusterEffect =
      musterEffect &&
      newUnit.effects &&
      newUnit.effects.map((id) => id.toString()).includes(musterEffect._id.toString())
    if (MusterBattlefield.logger.isTraceEnabled()) {
      MusterBattlefield.logger.trace(`${logPrefix} hasScorchEffect: "${hasMusterEffect}"`)
    }

    if (hasMusterEffect) {
      MusterBattlefield.logger.debug(`${logPrefix} unit "${newUnit.name}" has muster effect, applying it`)

      const musterableUnits = await UnitStore.get({
        namePrefix: newUnit.effectPrefix ? newUnit.effectPrefix : undefined,
        names: newUnit.effectPrefix ? undefined : [newUnit.name],
        ignoreIds: [newUnit._id],
      })

      if (MusterBattlefield.logger.isTraceEnabled()) {
        MusterBattlefield.logger.trace(`${logPrefix} musterableUnits: "${JSON.stringify(musterableUnits)}"`)
      }

      for (const musterableUnit of musterableUnits) {
        const impact = MusterBattlefield.musterUnitForCurrentPlayer({
          combat: musterableUnit.combats ? (musterableUnit.combats[0] as Combat) : undefined,
          game,
          logPrefix,
          potentialMuster: musterableUnit,
        })
        if (impact) {
          impacts.push(impact)
          musteredUnits.push(musterableUnit)
        }
      }
    }

    return {
      impacts: impacts.length > 0 ? impacts : undefined,
      musteredUnits,
    }
  }

  private static musterUnitForCurrentPlayer({
    combat,
    game,
    logPrefix,
    potentialMuster,
  }: {
    combat?: Combat | null
    game: GameDbObject
    logPrefix: string
    potentialMuster: UnitDbObject
  }): ImpactDbObject | undefined {
    let impact: ImpactDbObject | undefined = undefined
    for (const player of game.players) {
      if (player.user.toString() === game.turn?.toString()) {
        const round = player.rounds[game.round - 1]
        const undrawnUnit = player.deck.undrawn.find(
          (undrawnUnit) => undrawnUnit.unit.toString() === potentialMuster._id.toString()
        )
        const handUnit = player.deck.hand.find(
          (handUnit) => handUnit.unit.toString() === potentialMuster._id.toString()
        )
        // throw error if both?

        const unitToMuster = undrawnUnit || handUnit
        if (MusterBattlefield.logger.isTraceEnabled()) {
          MusterBattlefield.logger.trace(`${logPrefix} unitToMuster: "${JSON.stringify(unitToMuster)}"`)
        }

        if (unitToMuster) {
          impact = {
            unit: unitToMuster,
            user: player.user,
          }
          MusterBattlefield.logger.debug(`${logPrefix} found unit "${potentialMuster._id}" in undrawn pile to muster`)
          if (undrawnUnit) {
            player.deck.undrawn = player.deck.undrawn.filter(
              (deckUnit) => deckUnit.unit.toString() !== potentialMuster._id.toString()
            )
          }
          if (handUnit) {
            player.deck.hand = player.deck.hand.filter(
              (deckUnit) => deckUnit.unit.toString() !== potentialMuster._id.toString()
            )
          }
          if (combat === Combat.Close) {
            round.close.units.push(unitToMuster)
          } else if (combat === Combat.Ranged) {
            round.ranged.units.push(unitToMuster)
          } else if (combat === Combat.Siege) {
            round.siege.units.push(unitToMuster)
          }
        }
      }
    }
    return impact
  }
}
