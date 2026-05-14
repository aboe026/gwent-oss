import { getLogger } from 'log4js'

import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  FieldUnitDbObject,
  GameDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import EffectAvenger from './effect-avenger'
import EffectDecoy from './effect-decoy'
import EffectMardroeme from './effect-mardroeme'
import EffectMedic from './effect-medic'
import EffectMuster, { MusteredOrigins } from './effect-muster'
import EffectScorch from './effect-scorch'
import EffectSpy from './effect-spy'
import EffectWeather from './effect-weather'
import { GameUnitType } from '@gwent/graphql-schema'
import { ImpactsByUnitId } from '../../resolver-util'
import mergeImpacts from './merge-impacts'
import mergeMusteredOrigins from './merge-mustered-origins'

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
   * @param config.unitsToRevive Any potential Units which should be revived to the battlefield by a Medic being played.
   * @param config.combat The combat row the unit is being deployed to.
   * @param config.effects The effects that any unit might have.
   * @param config.game The game whose battlefield should have the units deployment applied to it.
   * @param config.logPrefix What to prepend log statements with.
   * @param config.newDeckUnit The new DeckUnit being introduced to the battlefield.
   * @param config.newUnit The new Unit being introduced to the battlefield.
   * @param config.targetIds Potential IDs of resources effected by card. For example, would contain a User ID for Spy, Unit ID for Decoy, or Unit IDs for Medic.
   * @param config.isDecoy Whether or not the new unit being played has the Decoy effect.
   * @param config.isSpy Whether or not the new unit being played has the Spy effect.
   * @param config.isWeather Whether or not the new unit being played has the Weather effect.
   * @param config.isMedic Whether or not the new unit being played has the Medic effect.
   * @returns Any impacts the new unit has on the battlefield.
   */
  static async modifyBattlefieldWithNewUnit({
    battlefieldUnits,
    unitsToRevive = [],
    combat,
    effects,
    game,
    logPrefix,
    newDeckUnit,
    newUnit,
    targetIds,
    isDecoy,
    isSpy,
    isWeather,
    isMedic,
  }: {
    battlefieldUnits: UnitDbObject[]
    unitsToRevive?: UnitDbObject[]
    combat?: Combat | null
    effects: EffectDbObject[]
    game: GameDbObject
    logPrefix: string
    newDeckUnit: DeckUnitDbObject
    newUnit: UnitDbObject
    targetIds: string[] | undefined | null
    isDecoy: boolean
    isSpy: boolean
    isWeather: boolean
    isMedic: boolean
  }): Promise<ModificationImpacts> {
    const deckUnitsAddedToHand: DeckUnitDbObject[] = []

    let weatherImpacts = EffectWeather.weatherBattlefield({
      game,
      logPrefix,
      newDeckUnit,
      newUnit,
      isWeather,
    })

    const spies = EffectSpy.spyBattlefield({
      combat,
      game,
      isSpy,
      logPrefix,
      newDeckUnit,
      targetIds,
    })
    let spyImpacts = spies.impacts
    deckUnitsAddedToHand.push(...spies.deckUnitsAddedToHand)

    BattlefieldUpdates.addNewUnitToBattlefield({
      combat,
      game,
      newDeckUnit,
      newUnit,
      weather: isWeather,
      spy: isSpy,
    })

    let scorches = EffectScorch.scorchBattlefield({
      battlefieldUnits,
      effects,
      game,
      logPrefix,
      newDeckUnit,
    })
    let { avengedUnits, impacts: avengers } = await EffectAvenger.avengeRemovedUnits({
      battlefieldUnits,
      effects,
      game,
      logPrefix,
      removedGameUnits: Object.values(scorches)
        .flat()
        .map((scorch) => {
          return {
            user: scorch.user,
            unit: scorch.unit,
          }
        }),
    })
    let {
      impacts: musterImpacts,
      musteredUnits,
      musteredOrigins,
    } = await EffectMuster.musterBattlefield({
      battlefieldUnits,
      effects,
      combat,
      game,
      logPrefix,
      newDeckUnit,
    })
    let {
      impacts: mardroemeImpacts,
      transformedUnits,
      transformedFieldUnits,
      mardroemingFieldUnit,
    } = await EffectMardroeme.transformBerserkers({
      battlefieldUnits: [...battlefieldUnits, ...musteredUnits],
      effects,
      game,
      logPrefix,
      newDeckUnit,
      combat,
    })
    const decoys = EffectDecoy.decoyFromBattlefield({
      game,
      logPrefix,
      newDeckUnit,
      combat,
      targetIds,
      isDecoy,
    })
    let decoyImpacts = decoys.impacts
    if (decoys.deckUnitAddedToHand) {
      deckUnitsAddedToHand.push(decoys.deckUnitAddedToHand)
    }

    const medics = await EffectMedic.reviveLostUnits({
      unitsToRevive,
      effects,
      game,
      logPrefix,
      newDeckUnit,
      isMedic,
      targetIds,
    })
    let medicImpacts = medics.impacts
    const revivals = medics.revivals

    for (let i = 0; i < revivals.length; i++) {
      const revival = revivals[i]
      let combat: Combat | null | undefined = undefined
      if (revival.gameUnit.type === GameUnitType.Field) {
        combat = (revival.gameUnit as FieldUnitDbObject).row as Combat
      }
      battlefieldUnits.push(revival.unit)
      const modifications = await BattlefieldUpdates.modifyBattlefieldWithNewUnit({
        battlefieldUnits,
        effects,
        game,
        isDecoy: false, // cannot revive decoys since they are special
        isMedic: revival.isMedic,
        isSpy: revival.isSpy,
        isWeather: false, // cannot revive weathers since they are special
        logPrefix,
        newDeckUnit: {
          artStyle: revival.gameUnit.artStyle,
          unit: revival.gameUnit.unit,
        },
        newUnit: revival.unit,
        targetIds: targetIds?.slice(i + 1),
        combat,
        unitsToRevive,
      })

      avengers = mergeImpacts(avengers, modifications.avengers)
      avengedUnits = [...avengedUnits, ...modifications.avengedUnits]
      decoyImpacts = mergeImpacts(decoyImpacts, modifications.decoys)
      deckUnitsAddedToHand.push(...modifications.deckUnitsAddedToHand)
      scorches = mergeImpacts(scorches, modifications.scorches)
      musterImpacts = mergeImpacts(musterImpacts, modifications.musters)
      musteredUnits = [...musteredUnits, ...modifications.musteredUnits]
      musteredOrigins = mergeMusteredOrigins(musteredOrigins, modifications.musteredOrigins)
      mardroemeImpacts = mergeImpacts(mardroemeImpacts, modifications.mardroemes)
      transformedUnits = [...transformedUnits, ...modifications.transformedUnits]
      transformedFieldUnits = [...transformedFieldUnits, ...modifications.transformedFieldUnits]
      if (modifications.mardroemingFieldUnit) {
        mardroemingFieldUnit = modifications.mardroemingFieldUnit
      }
      spyImpacts = mergeImpacts(spyImpacts, modifications.spies)
      medicImpacts = mergeImpacts(medicImpacts, modifications.medics)
      weatherImpacts = mergeImpacts(weatherImpacts, modifications.weathers)
    }

    return {
      avengers,
      avengedUnits,
      decoys: decoyImpacts,
      deckUnitsAddedToHand,
      scorches,
      musters: musterImpacts,
      musteredUnits,
      musteredOrigins,
      mardroemes: mardroemeImpacts,
      spies: spyImpacts,
      transformedUnits,
      transformedFieldUnits,
      mardroemingFieldUnit,
      medics: medicImpacts,
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
   * @param config.weather Whether or not the new unit being added to the battlefield has the Weather effect.
   * @param config.spy Whether or not the new unit being added to the battlefield has the Spy effect.
   */
  static addNewUnitToBattlefield({
    combat,
    game,
    newDeckUnit,
    newUnit,
    weather,
    spy,
  }: {
    combat?: Combat | null
    game: GameDbObject
    newDeckUnit: DeckUnitDbObject
    newUnit: UnitDbObject
    weather: boolean
    spy: boolean
  }) {
    for (const player of game.players) {
      const round = player.rounds[game.round - 1]
      if (player.user.toString() === game.turn?.toString()) {
        player.deck.hand = player.deck.hand.filter(
          (handUnit) => handUnit.unit.toString() !== newDeckUnit.unit.toString()
        )
        if (!weather && !spy && combat) {
          const fieldUnit: FieldUnitDbObject = {
            ...newDeckUnit,
            effectiveStrength: undefined,
            effects: [],
            row: combat,
          }
          if (combat === Combat.Close) {
            if (newUnit.modifier) {
              round.close.modifier = fieldUnit
            } else {
              round.close.units.push(fieldUnit)
            }
          } else if (combat === Combat.Ranged) {
            if (newUnit.modifier) {
              round.ranged.modifier = fieldUnit
            } else {
              round.ranged.units.push(fieldUnit)
            }
          } else {
            if (newUnit.modifier) {
              round.siege.modifier = fieldUnit
            } else {
              round.siege.units.push(fieldUnit)
            }
          }
        }
      }
    }
  }
}

interface ModificationImpacts {
  avengers: ImpactsByUnitId
  avengedUnits: UnitDbObject[]
  decoys: ImpactsByUnitId
  deckUnitsAddedToHand: DeckUnitDbObject[]
  scorches: ImpactsByUnitId
  musters: ImpactsByUnitId
  musteredUnits: UnitDbObject[]
  musteredOrigins: MusteredOrigins
  mardroemes: ImpactsByUnitId
  spies: ImpactsByUnitId
  transformedUnits: UnitDbObject[]
  transformedFieldUnits: FieldUnitDbObject[]
  mardroemingFieldUnit: FieldUnitDbObject | undefined
  medics: ImpactsByUnitId
  weathers: ImpactsByUnitId
}
