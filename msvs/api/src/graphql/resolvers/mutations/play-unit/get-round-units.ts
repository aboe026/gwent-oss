import { GameDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import UnitStore from '../../../../database/stores/unit-store'

/**
 * Gets all Units on the battlefield in the current round of the game from the database.
 *
 * @param config The configuration used to get the Units.
 * @param config.game The game whose currently deployed battlefield units on the current round should be retreived.
 * @param config.unitBeingPlayed The current unit being played and for which the database object has already been retreived, making it unnecessary to retreive it again.
 * @returns An array of all database Units on the battlefield in the current round of the game, including the unitBeingPlayed.
 */
export default async function getRoundUnits({
  game,
  unitBeingPlayed,
}: {
  game: GameDbObject
  unitBeingPlayed: UnitDbObject
}): Promise<UnitDbObject[]> {
  const unitIds: string[] = [unitBeingPlayed.toString()] // to be removed at end, used just for now to ignore potential duplicates
  for (const player of game.players) {
    const round = player.rounds[game.round - 1]
    const rowUnits = [...round.close.units, ...round.ranged.units, ...round.siege.units]
    for (const modifier of [round.close.modifier, round.ranged.modifier, round.siege.modifier]) {
      if (modifier) {
        rowUnits.push(modifier)
      }
    }
    for (const rowUnit of rowUnits) {
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
