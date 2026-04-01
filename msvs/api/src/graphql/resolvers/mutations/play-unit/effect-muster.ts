import { getLogger } from 'log4js'

import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  ImpactDbObject,
  GameUnitOrigin,
  UnitDbObject,
  GameUnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import GetEffectWithKey from './get-effect-with-key'
import { ImpactsByUnitId } from '../../resolver-util'
import { sortObjectArray } from '@gwent/utils'
import UnitStore from '../../../../database/stores/unit-store'
import { GameUnitType } from '@gwent/graphql-schema'

/**
 * A class to Muster units to the battlefield.
 */
export default class EffectMuster {
  private static logger = getLogger('EffectMuster')

  /**
   * Potentially muster Units to the battlefield due to a new unit deployment.
   *
   * @param config The configuration used to potentially muster new Units.
   * @param config.battlefieldUnits All the existing Units on the battlefield.
   * @param config.combat The combat row the new unit is being played on.
   * @param config.effects The Effect database documents for any potential effect involved in the Game.
   * @param config.game The Game to potentially muster the Units into.
   * @param config.logPrefix What to prepend log statements with.
   * @param config.newDeckUnit The new unit deployed to the battlefield which is potentially mustering other Units.
   * @returns Information about any new Units mustered to the battlefield.
   */
  static async musterBattlefield({
    battlefieldUnits,
    combat,
    effects,
    game,
    logPrefix,
    newDeckUnit,
  }: {
    battlefieldUnits: UnitDbObject[]
    combat?: Combat | null
    effects: EffectDbObject[]
    game: GameDbObject
    logPrefix: string
    newDeckUnit: DeckUnitDbObject
  }): Promise<Musterings> {
    const impacts: ImpactDbObject[] = []
    const musteredUnits: UnitDbObject[] = []
    const musteredOrigins: MusteredOrigins = {}

    const newUnit = battlefieldUnits.find((unit) => unit._id.toString() === newDeckUnit.unit.toString())
    if (!newUnit) {
      const message = `Could not find unit for new deck unit "${newDeckUnit.unit}"`
      EffectMuster.logger.error(
        `${logPrefix} failed: ${message}, battlefieldUnits: "${JSON.stringify(battlefieldUnits)}"`
      )
      throw Error(`${message}.`)
    }
    if (EffectMuster.logger.isTraceEnabled()) {
      EffectMuster.logger.trace(`${logPrefix} newUnit: "${JSON.stringify(newUnit)}"`)
    }

    const musterEffect = GetEffectWithKey.getEffectWithKey({
      effectKey: EffectKey.Muster,
      effects,
      logPrefix,
    })
    if (EffectMuster.logger.isTraceEnabled()) {
      EffectMuster.logger.trace(`${logPrefix} musterEffect: "${JSON.stringify(musterEffect)}"`)
    }
    const hasMusterEffect =
      musterEffect &&
      newUnit.effects &&
      newUnit.effects.map((id) => id.toString()).includes(musterEffect._id.toString())
    if (EffectMuster.logger.isTraceEnabled()) {
      EffectMuster.logger.trace(`${logPrefix} hasMusterEffect: "${hasMusterEffect}"`)
    }

    if (hasMusterEffect && combat) {
      EffectMuster.logger.debug(`${logPrefix} unit "${newUnit.name}" has muster effect, applying it`)

      const musterableUnits = await UnitStore.get({
        namePrefix: newUnit.effectPrefix ? `"${newUnit.effectPrefix}"` : undefined,
        names: newUnit.effectPrefix ? undefined : [newUnit.name],
        ignoreIds: [newUnit._id],
      })

      if (EffectMuster.logger.isTraceEnabled()) {
        EffectMuster.logger.trace(`${logPrefix} musterableUnits: "${JSON.stringify(musterableUnits)}"`)
      }

      for (const musterableUnit of musterableUnits) {
        const { impact, origin } = EffectMuster.getMusterImpact({
          game,
          logPrefix,
          combat,
          potentialMuster: musterableUnit,
        })
        if (impact && origin) {
          impacts.push(impact)
          musteredUnits.push(musterableUnit)
          musteredOrigins[musterableUnit._id.toString()] = origin
        }
      }
    }

    // sort to ensure units from hand show first in history/impacts (reduces non-deterministic behavior in tests)
    const sortedImpacts = sortObjectArray({
      array: impacts,
      sortProperties: ['source.origin'],
    })

    for (const impact of sortedImpacts) {
      if (impact.unit !== undefined) {
        const unit = musteredUnits.find((musteredUnit) => musteredUnit._id.toString() === impact.unit?.unit.toString())
        if (!unit) {
          const message = `Could not find unit "${impact.unit?.unit}" from muster impact`
          EffectMuster.logger.error(`${logPrefix} ${message}, impact: "${JSON.stringify(impact)}"`)
          throw Error(`${message}.`)
        }
        const combat = unit.combats ? (unit.combats[0] as Combat) : undefined
        if (!combat) {
          const message = `Cannot muster unit "${unit._id}" without combat`
          EffectMuster.logger.error(`${logPrefix} ${message}`)
          throw Error(`${message}.`)
        }
        EffectMuster.musterUnitToBattlefield({
          combat,
          game,
          muster: impact.unit,
          origin: musteredOrigins[unit._id.toString()],
        })
      } else {
        const message = `Impact for muster does not have unit: "${JSON.stringify(impact)}"`
        EffectMuster.logger.error(`${logPrefix} ${message}, impact: "${JSON.stringify(impact)}"`)
        throw Error(`${message}.`)
      }
    }

    return {
      impacts:
        sortedImpacts.length > 0
          ? {
              [newDeckUnit.unit.toString()]: sortedImpacts,
            }
          : {},
      musteredUnits,
      musteredOrigins,
    }
  }

  /**
   * Get the impact for the unit if it is eligible for mustering (in current players hand or undrawn pile).
   *
   * @param config The configuration used to potentially muster the unit.
   * @param config.game The game containing the player to potentially muster the unit for.
   * @param config.combat The combat row the new units are being mustered into.
   * @param config.logPrefix What to prepend log statements with.
   * @param config.potentialMuster The Unit to potentially muster for the game player.
   * @returns The Impact and Origin of the muster if eligible.
   */
  private static getMusterImpact({
    game,
    combat,
    logPrefix,
    potentialMuster,
  }: {
    game: GameDbObject
    combat: Combat
    logPrefix: string
    potentialMuster: UnitDbObject
  }): MusterForPlayer {
    let impact: ImpactDbObject | undefined = undefined
    let origin: GameUnitOrigin | undefined = undefined
    for (const player of game.players) {
      if (player.user.toString() === game.turn?.toString()) {
        const undrawnUnit = player.deck.undrawn.find(
          (undrawnUnit) => undrawnUnit.unit.toString() === potentialMuster._id.toString()
        )
        const handUnit = player.deck.hand.find(
          (handUnit) => handUnit.unit.toString() === potentialMuster._id.toString()
        )
        if (undrawnUnit && handUnit) {
          const message = `Unit "${potentialMuster._id}" found in both hand and undrawn`
          EffectMuster.logger.error(`${logPrefix} failed: ${message}`)
          throw Error(`${message}.`)
        }

        const unitToMuster = undrawnUnit || handUnit
        if (EffectMuster.logger.isTraceEnabled()) {
          EffectMuster.logger.trace(`${logPrefix} unitToMuster: "${JSON.stringify(unitToMuster)}"`)
        }

        if (unitToMuster) {
          if (undrawnUnit) {
            EffectMuster.logger.debug(`${logPrefix} found unit "${potentialMuster._id}" in undrawn pile to muster`)
            origin = GameUnitOrigin.Undrawn
          } else {
            EffectMuster.logger.debug(`${logPrefix} found unit "${potentialMuster._id}" in hand to muster`)
            origin = GameUnitOrigin.Hand
          }

          impact = {
            unit: {
              ...unitToMuster,
              row: combat,
              type: GameUnitType.Field,
            },
            user: player.user,
            source: {
              origin,
            },
          }
        }
      }
    }
    return {
      impact,
      origin,
    }
  }

  /**
   * Move the musterable unit into the battlefield.
   *
   * @param config The configuration used to muster the unit into the battlefield.
   * @param config.combat The combat row to muster the unit into.
   * @param config.game The game the unit should be mustered into.
   * @param config.origin There the Unit was mustered from.
   * @param config.muster The Unit to muster into the battlefield.
   */
  private static musterUnitToBattlefield({
    combat,
    game,
    origin,
    muster,
  }: {
    combat: Combat
    game: GameDbObject
    origin: GameUnitOrigin
    muster: DeckUnitDbObject
  }) {
    for (const player of game.players) {
      if (player.user.toString() === game.turn?.toString()) {
        if (origin === GameUnitOrigin.Hand) {
          player.deck.hand = player.deck.hand.filter((deckUnit) => deckUnit.unit.toString() !== muster.unit.toString())
        } else {
          player.deck.undrawn = player.deck.undrawn.filter(
            (deckUnit) => deckUnit.unit.toString() !== muster.unit.toString()
          )
        }

        const round = player.rounds[game.round - 1]
        const gameUnit: GameUnitDbObject = {
          ...muster,
          row: combat,
        }
        if (combat === Combat.Close) {
          round.close.units.push(gameUnit)
        } else if (combat === Combat.Ranged) {
          round.ranged.units.push(gameUnit)
        } else {
          round.siege.units.push(gameUnit)
        }
      }
    }
  }
}

export interface MusteredOrigins {
  [id: string]: GameUnitOrigin
}

export interface MusterForPlayer {
  impact: ImpactDbObject | undefined
  origin: GameUnitOrigin | undefined
}

export interface Musterings {
  impacts: ImpactsByUnitId
  musteredUnits: UnitDbObject[]
  musteredOrigins: MusteredOrigins
}
