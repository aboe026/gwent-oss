import { DeckUnit } from '@gwent/graphql-schema/resolver-typings'
import { DeckUnitDbObject } from '@gwent/graphql-schema/database-typings'

export interface PlayersToDeckUnitDbObjects {
  [playerId: string]: DeckUnitDbObject[]
}

export interface PlayersToDeckUnits {
  [playerId: string]: DeckUnit[]
}

/**
 * Merge multiple PlayersToDeckUnitDbObjects into a single one.
 *
 * @param playersToDeckUnitDbObjectsArray The multiple PlayersToDeckUnitDbObjects to merge into a single one.
 * @returns All of the PlayersToDeckUnitDbObjects merged into one.
 */
export function mergePlayersToDeckUnitDbObjects(
  ...playersToDeckUnitDbObjectsArray: PlayersToDeckUnitDbObjects[]
): PlayersToDeckUnitDbObjects {
  const merged: PlayersToDeckUnitDbObjects = {}

  for (const playersToDeckUnitDbObjects of playersToDeckUnitDbObjectsArray) {
    for (const playerId of Object.keys(playersToDeckUnitDbObjects)) {
      const playerDiscards = playersToDeckUnitDbObjects[playerId]
      if (merged[playerId]) {
        merged[playerId].push(...playerDiscards)
      } else {
        merged[playerId] = playerDiscards
      }
    }
  }

  return merged
}
