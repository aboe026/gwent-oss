import { getLogger } from 'log4js'

import DeckUnitResolver from './deck-unit-resolver'
import { PlayersToDeckUnitDbObjects, PlayersToDeckUnits } from '../mutations/util/players-to-deck-units'

/**
 * A class to resolved the DeckUnits of PlayersToDeckUnitDbObjects.
 */
export default class PlayersToDeckUnitsResolver {
  private static logger = getLogger('PlayersToDeckUnitsResolver')

  /**
   * Resolves the DeckUnit cards in a PlayersToDeckUnitDbObjects object.
   *
   * @param playersToDeckUnitsDbObjects The PlayersToDeckUnitDbObjects to have their DeckUnits resolved.
   * @returns The PlayersToDeckUnitDbObjects with their DeckUnits resolved.
   */
  static async fromObject(playersToDeckUnitsDbObjects: PlayersToDeckUnitDbObjects): Promise<PlayersToDeckUnits> {
    const resolvedPlayersToDeckUnits: PlayersToDeckUnits = {}

    if (playersToDeckUnitsDbObjects) {
      const resolvedDeckUnits = await DeckUnitResolver.fromArray({
        deckUnits: Object.values(playersToDeckUnitsDbObjects).flat(),
      })

      for (const playerId of Object.keys(playersToDeckUnitsDbObjects)) {
        resolvedPlayersToDeckUnits[playerId] = []
        for (const deckUnit of playersToDeckUnitsDbObjects[playerId]) {
          const resolvedDeckUnit = resolvedDeckUnits.find(
            (resolvedDeckUnit) => resolvedDeckUnit.unit.id === deckUnit.unit.toString()
          )
          if (resolvedDeckUnit) {
            resolvedPlayersToDeckUnits[playerId].push(resolvedDeckUnit)
          } else {
            const message = `Could not resolve player "${playerId}" DeckUnit "${deckUnit.unit}"`
            PlayersToDeckUnitsResolver.logger.error(`${message}.`)
            throw Error(message)
          }
        }
      }
    }

    return resolvedPlayersToDeckUnits
  }
}
