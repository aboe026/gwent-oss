import { getLogger } from 'log4js'

import { Combat, DeckUnitDbObject, GameDbObject, ImpactDbObject } from '@gwent/graphql-schema/database-typings'
import { getRandomNumber } from '@gwent/utils'
import { ImpactsByUnitId } from '../../resolver-util'
import PresentableError from '../../../../util/presentable-error'

/**
 * A class to modify the battlefield if a spying unit is played.
 */
export default class EffectSpy {
  private static logger = getLogger('EffectSpy')

  /**
   * If spy, deploy to opponents battlefield and draw up to 2 random units from undrawn into hand.
   *
   * @param config The configuration used to spy the battlefield.
   * @param config.game The game the decoy is being made on.
   * @param config.logPrefix What to prepend log statements with.
   * @param config.newDeckUnit The Decoy unit being played.
   * @param config.combat The combat row the new unit, and in effect the target, are in.
   * @param config.targetId The ID of the battlefield unit to replace with the Decoy.
   * @param config.isSpy Whether or not the new unit being played has the Spy effect.
   * @throws {PresentableError} If problem decoying target.
   * @returns If the unit being played is a Decoy, the unit removed from the battlefield and its Impact, otherwise undefined.
   */
  static spyBattlefield({
    game,
    logPrefix,
    newDeckUnit,
    combat,
    targetId,
    isSpy,
  }: {
    game: GameDbObject
    logPrefix: string
    newDeckUnit: DeckUnitDbObject
    combat: Combat | null | undefined
    targetId: string | undefined | null
    isSpy: boolean
  }): PotentialSpies {
    const impacts: ImpactDbObject[] = []
    const deckUnitsAddedToHand: DeckUnitDbObject[] = []

    if (isSpy && targetId && combat) {
      const opponent = game.players.find((player) => player.user.toString() === targetId)

      if (opponent) {
        const round = opponent.rounds[game.round - 1]

        EffectSpy.logger.debug(
          `${logPrefix} putting spy "${newDeckUnit.unit}" in "${combat}" row of opponent "${targetId}"`
        )
        if (combat === Combat.Close) {
          round.close.units.push(newDeckUnit)
        } else if (combat === Combat.Ranged) {
          round.ranged.units.push(newDeckUnit)
        } else {
          round.siege.units.push(newDeckUnit)
        }
      } else {
        const message = `Could not find opponent "${targetId}"`
        EffectSpy.logger.error(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }

      const self = game.players.find((player) => player.user.toString() === game.turn?.toString())
      if (self) {
        const numberToMoveToHand = self.deck.undrawn.length > 2 ? 2 : self.deck.undrawn.length
        for (let i = 0; i < numberToMoveToHand; i++) {
          const index = getRandomNumber({
            min: 0,
            max: self.deck.undrawn.length - 1,
          })
          const undrawnToMoveToHand = self.deck.undrawn.splice(index, 1)[0]
          EffectSpy.logger.debug(
            `${logPrefix} moving undrawn unit "${undrawnToMoveToHand.unit}" to hand due to spy "${newDeckUnit.unit}"`
          )
          self.deck.hand.push(undrawnToMoveToHand)
          deckUnitsAddedToHand.push(undrawnToMoveToHand)
          impacts.push({
            unit: undrawnToMoveToHand,
            user: self.user,
          })
        }
      } else {
        const message = `Could not find current turn user "${game.turn}"`
        EffectSpy.logger.error(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
    }

    return {
      deckUnitsAddedToHand,
      impacts:
        impacts.length > 0
          ? {
              [newDeckUnit.unit.toString()]: impacts,
            }
          : {},
    }
  }
}

export interface PotentialSpies {
  deckUnitsAddedToHand: DeckUnitDbObject[]
  impacts: ImpactsByUnitId
}
