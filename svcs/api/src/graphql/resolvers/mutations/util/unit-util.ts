import { EffectDbObject, GameDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import EffectStore from '../../../../database/stores/effect-store'
import UnitStore from '../../../../database/stores/unit-store'

/**
 * A class containing utility methods for interacting with Units.
 */
export default class UnitUtil {
  /**
   * Gets all Units on the battlefield in the current round of the game from the database.
   *
   * @param config The configuration used to get the Units.
   * @param config.game The game whose currently deployed battlefield units on the current round should be retreived.
   * @param confing.unitBeingPlayed The current unit being played and for which the database object has already been retreived, making it unnecessary to retreive it again.
   * @returns An array of all database Units on the battlefield in the current round of the game, including the unitBeingPlayed.
   */
  static async getRoundUnits({
    game,
    unitBeingPlayed,
  }: {
    game: GameDbObject
    unitBeingPlayed: UnitDbObject
  }): Promise<UnitDbObject[]> {
    const unitIds: string[] = [unitBeingPlayed.toString()] // to be removed at end, used just for now to ignore potential duplicates
    for (const player of game.players) {
      const round = player.rounds[game.round - 1]
      for (const rowUnit of [...round.close.units, ...round.ranged.units, ...round.siege.units]) {
        if (!unitIds.includes(rowUnit.unit.toString())) {
          unitIds.push(rowUnit.unit.toString())
        }
      }
    }

    const units = await UnitStore.get({
      ids: unitIds.slice(1), // remove the deckUnit we have already retrieved
    })

    return [...units, unitBeingPlayed]
  }

  /**
   * Gets the Effect database documents for all effects present on a list of Unit database objects.
   *
   * @param units The units containing potential effect IDs that the full Effect database documents should be grabbed for.
   * @returns The database documents of any Effects present in the Unit objects.
   */
  static async getUnitEffects(units: UnitDbObject[]): Promise<EffectDbObject[]> {
    const effectIds: string[] = []
    for (const unit of units) {
      if (unit.effects) {
        for (const unitEffect of unit.effects) {
          const effect = unitEffect.toString()
          if (!effectIds.includes(effect)) {
            effectIds.push(effect)
          }
        }
      }
    }

    if (effectIds.length === 0) {
      return []
    } else {
      return EffectStore.get({
        ids: effectIds,
      })
    }
  }
}
