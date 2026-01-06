import { getLogger } from 'log4js'

import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  GameDbObject,
  GameUnitDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import EffectDecoy from './effect-decoy'
import EffectMardroeme from './effect-mardroeme'
import EffectMuster, { MusteredOrigins } from './effect-muster'
import EffectScorch from './effect-scorch'
import EffectWeather from './effect-weather'
import { ImpactsByUnitId } from '../../resolver-util'

/**
 * A class for altering the units present on the battlefield due to a player move.
 */
export default class BattlefieldUpdates {
  private static logger = getLogger('BattlefieldUpdates')

  /**
   * Modifies the battlefield of the current round in a game due to the deployment of a new unit. Other units on or off the battlefield may be impacted by unit effects.
   *
   * @param config The configuration used to determine the impact the new unit has on the battlefield.
   * @param config.battlefieldUnits All of the Units currently on the battlefield.
   * @param config.combat The combat row the unit is being deployed to.
   * @param config.effects The effects that any unit might have.
   * @param config.game The game whose battlefield should have the units deployment applied to it.
   * @param config.logPrefix What to prepend log statements with.
   * @param config.newDeckUnit The new DeckUnit being introduced to the battlefield.
   * @param config.newUnit The new Unit being introduced to the battlefield.
   * @param config.targetId The ID of a potential Unit being targeted by the new battlefield unit. Used for Decoy and Spies.
   * @returns Any impacts the new unit has on the battlefield.
   */
  static async modifyBattlefieldWithNewUnit({
    battlefieldUnits,
    combat,
    effects,
    game,
    logPrefix,
    newDeckUnit,
    newUnit,
    targetId,
  }: {
    battlefieldUnits: UnitDbObject[]
    combat?: Combat | null
    effects: EffectDbObject[]
    game: GameDbObject
    logPrefix: string
    newDeckUnit: DeckUnitDbObject
    newUnit: UnitDbObject
    targetId: string | undefined | null
  }): Promise<ModificationImpacts> {
    const deckUnitsAddedToHand: DeckUnitDbObject[] = []

    const { impacts: weatherImpacts, newUnitHasWeather } = EffectWeather.weatherBattlefield({
      effects,
      game,
      logPrefix,
      newDeckUnit,
      newUnit,
    })

    BattlefieldUpdates.addNewUnitToBattlefield({
      combat,
      game,
      newDeckUnit,
      newUnit,
      newUnitHasWeather,
    })

    const scorches = EffectScorch.scorchBattlefield({
      battlefieldUnits,
      effects,
      game,
      logPrefix,
      newDeckUnit,
    })
    const {
      impacts: musterImpacts,
      musteredUnits,
      musteredOrigins,
    } = await EffectMuster.musterBattlefield({
      battlefieldUnits,
      effects,
      game,
      logPrefix,
      newDeckUnit,
    })
    const {
      impacts: mardroemeImpacts,
      transformedUnits,
      transformedGameUnits,
      mardroemingGameUnit,
    } = await EffectMardroeme.transformBerserkers({
      battlefieldUnits: [...battlefieldUnits, ...musteredUnits],
      effects,
      game,
      logPrefix,
      newDeckUnit,
      combat,
    })
    const { deckUnitAddedToHand, impacts: decoyImpacts } = EffectDecoy.decoyFromBattlefield({
      game,
      logPrefix,
      newDeckUnit,
      combat,
      targetId,
    })
    if (deckUnitAddedToHand) {
      deckUnitsAddedToHand.push(deckUnitAddedToHand)
    }
    return {
      decoys: decoyImpacts,
      deckUnitsAddedToHand,
      scorches,
      musters: musterImpacts,
      musteredUnits,
      musteredOrigins,
      mardroemes: mardroemeImpacts,
      transformedUnits,
      transformedGameUnits,
      mardroemingGameUnit,
      weathers: weatherImpacts,
    }
  }

  /**
   * Adds a new DeckUnit to the battlefield.
   *
   * @param config The configuration used to add the DeckUnit to the battlefield.
   * @param config.combat The row on the battlefield to add the DeckUnit to.
   * @param config.game The Game whose battlefield the DeckUnit should be added to.
   * @param config.newDeckUnit The DeckUnit to add to the battlefield.
   * @param config.newUnit The new Unit being introduced to the battlefield.
   * @param config.newUnitHasWeather Whether or not the new unit being added to the battlefield has the Weather effect.
   */
  static addNewUnitToBattlefield({
    combat,
    game,
    newDeckUnit,
    newUnit,
    newUnitHasWeather,
  }: {
    combat?: Combat | null
    game: GameDbObject
    newDeckUnit: DeckUnitDbObject
    newUnit: UnitDbObject
    newUnitHasWeather: boolean
  }) {
    for (const player of game.players) {
      const round = player.rounds[game.round - 1]
      if (player.user.toString() === game.turn?.toString()) {
        player.deck.hand = player.deck.hand.filter(
          (handUnit) => handUnit.unit.toString() !== newDeckUnit.unit.toString()
        )
        if (!newUnitHasWeather) {
          if (combat === Combat.Close) {
            if (newUnit.modifier) {
              round.close.modifier = newDeckUnit
            } else {
              round.close.units.push(newDeckUnit)
            }
          } else if (combat === Combat.Ranged) {
            if (newUnit.modifier) {
              round.ranged.modifier = newDeckUnit
            } else {
              round.ranged.units.push(newDeckUnit)
            }
          } else if (combat === Combat.Siege) {
            if (newUnit.modifier) {
              round.siege.modifier = newDeckUnit
            } else {
              round.siege.units.push(newDeckUnit)
            }
          }
        }
      }
    }
  }
}

interface ModificationImpacts {
  decoys: ImpactsByUnitId
  deckUnitsAddedToHand: DeckUnitDbObject[]
  scorches: ImpactsByUnitId
  musters: ImpactsByUnitId
  musteredUnits: UnitDbObject[]
  musteredOrigins: MusteredOrigins
  mardroemes: ImpactsByUnitId
  transformedUnits: UnitDbObject[]
  transformedGameUnits: GameUnitDbObject[]
  mardroemingGameUnit: GameUnitDbObject | undefined
  weathers: ImpactsByUnitId
}
