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
} from '@gwent/graphql-schema/database-typings'
import GetEffectWithKey from './get-effect-with-key'
import { sortObjectArray } from '@gwent/utils'
import UnitStore from '../../../../database/stores/unit-store'

/**
 * A class to Muster units to the battlefield.
 */
export default class MusterBattlefield {
  private static logger = getLogger('MusterBattlefield')

  /**
   * Potentially muster Units to the battlefield due to a new unit deployment.
   *
   * @param config The configuration used to potentially muster new Units.
   * @param config.battlefieldUnits All the existing Units on the battlefield.
   * @param config.effects The Effect database documents for any potential effect involved in the Game.
   * @param config.game The Game to potentially muster the Units into.
   * @param config.logPrefix What to prepend log statements with.
   * @param config.newDeckUnit The new unit deployed to the battlefield which is potentially mustering other Units.
   * @returns Information about any new Units mustered to the battlefield.
   */
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
  }): Promise<Musterings> {
    const impacts: ImpactDbObject[] = []
    const musteredUnits: UnitDbObject[] = []
    const musteredOrigins: MusteredOrigins = {}

    const newUnit = battlefieldUnits.find((unit) => unit._id.toString() === newDeckUnit.unit.toString())
    if (!newUnit) {
      const message = `Could not find unit for new deck unit "${newDeckUnit.unit}"`
      MusterBattlefield.logger.error(
        `${logPrefix} failed: ${message}, battlefieldUnits: "${JSON.stringify(battlefieldUnits)}"`
      )
      throw Error(`${message}.`)
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
      MusterBattlefield.logger.trace(`${logPrefix} hasMusterEffect: "${hasMusterEffect}"`)
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
        const combat = musterableUnit.combats ? (musterableUnit.combats[0] as Combat) : undefined
        if (!combat) {
          const message = `Cannot muster unit "${musterableUnit._id}" without combat`
          MusterBattlefield.logger.error(`${logPrefix} failed: ${message}`)
          throw Error(`${message}.`)
        }
        const { impact, origin } = MusterBattlefield.musterUnitForCurrentPlayer({
          combat,
          game,
          logPrefix,
          potentialMuster: musterableUnit,
        })
        if (impact && origin) {
          impacts.push(impact)
          musteredUnits.push(musterableUnit)
          musteredOrigins[musterableUnit._id.toString()] = origin
        }
      }
    }

    return {
      impacts:
        impacts.length > 0
          ? // sort to ensure units from hand show first in history/impacts (reduces non-deterministic behavior in tests)
            sortObjectArray({
              array: impacts,
              sortProperties: ['source.origin'],
            })
          : undefined,
      musteredUnits,
      musteredOrigins,
    }
  }

  /**
   * Potentially muster a unit to the battlefield for the current game player if in their hand or undrawn pile.
   *
   * @param config The configuration used to potentially muster the unit.
   * @param config.combat The Combat row the unit should be mustered to.
   * @param config.game The game containing the player to potentially muster the unit for.
   * @param config.logPrefix What to prepend log statements with.
   * @param config.potentialMuster The Unit to potentially muster for the game player.
   * @returns The mustered Unit if it is eligible to be mustered by the player.
   */
  private static musterUnitForCurrentPlayer({
    combat,
    game,
    logPrefix,
    potentialMuster,
  }: {
    combat?: Combat
    game: GameDbObject
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
          MusterBattlefield.logger.error(`${logPrefix} failed: ${message}`)
          throw Error(`${message}.`)
        }

        const unitToMuster = undrawnUnit || handUnit
        if (MusterBattlefield.logger.isTraceEnabled()) {
          MusterBattlefield.logger.trace(`${logPrefix} unitToMuster: "${JSON.stringify(unitToMuster)}"`)
        }

        if (unitToMuster) {
          if (undrawnUnit) {
            MusterBattlefield.logger.debug(`${logPrefix} found unit "${potentialMuster._id}" in undrawn pile to muster`)
            origin = GameUnitOrigin.Undrawn
            player.deck.undrawn = player.deck.undrawn.filter(
              (deckUnit) => deckUnit.unit.toString() !== potentialMuster._id.toString()
            )
          } else {
            MusterBattlefield.logger.debug(`${logPrefix} found unit "${potentialMuster._id}" in hand to muster`)
            origin = GameUnitOrigin.Hand
            player.deck.hand = player.deck.hand.filter(
              (deckUnit) => deckUnit.unit.toString() !== potentialMuster._id.toString()
            )
          }
          const round = player.rounds[game.round - 1]
          if (combat === Combat.Close) {
            round.close.units.push(unitToMuster)
          } else if (combat === Combat.Ranged) {
            round.ranged.units.push(unitToMuster)
          } else {
            round.siege.units.push(unitToMuster)
          }

          impact = {
            unit: unitToMuster,
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
}

export interface MusteredOrigins {
  [id: string]: GameUnitOrigin
}

export interface MusterForPlayer {
  impact: ImpactDbObject | undefined
  origin: GameUnitOrigin | undefined
}

export interface Musterings {
  impacts: ImpactDbObject[] | undefined
  musteredUnits: UnitDbObject[]
  musteredOrigins: MusteredOrigins
}
