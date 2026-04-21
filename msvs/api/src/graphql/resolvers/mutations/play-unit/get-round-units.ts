import { GameDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import UnitStore from '../../../../database/stores/unit-store'

/**
 * Gets all Units on the battlefield in the current round of the game from the database.
 *
 * @param config The configuration used to get the Units.
 * @param config.game The game whose currently deployed battlefield units on the current round should be retreived.
 * @param config.unitBeingPlayed The current unit being played and for which the database object has already been retreived, making it unnecessary to retreive it again.
 * @param config.units Any potential Unit objects which have already been retrieved.
 * @param config.round The round of the game to get Units for. If not provided, will be current round of the game.
 * @returns An array of all database Units on the battlefield in the current round of the game, including the unitBeingPlayed.
 */
export default async function getRoundUnits({
  game,
  unitBeingPlayed,
  units,
  round,
}: {
  game: GameDbObject
  unitBeingPlayed?: UnitDbObject
  units?: UnitDbObject[]
  round?: number
}): Promise<UnitDbObject[]> {
  const unitIds: string[] = []

  const existingUnitIds: string[] = []
  if (unitBeingPlayed) {
    existingUnitIds.push(unitBeingPlayed._id.toString())
  }
  if (units) {
    existingUnitIds.push(...units.map((unit) => unit._id.toString()))
  }

  const gameRound = round === undefined ? game.round - 1 : round
  for (const player of game.players) {
    const round = player.rounds[gameRound]
    for (const rowUnit of [...round.close.units, ...round.ranged.units, ...round.siege.units]) {
      if (!unitIds.includes(rowUnit.unit.toString()) && !existingUnitIds.includes(rowUnit.unit.toString())) {
        unitIds.push(rowUnit.unit.toString())
      }
    }
    for (const modifier of [round.close.modifier, round.ranged.modifier, round.siege.modifier]) {
      if (
        modifier &&
        !unitIds.includes(modifier.unit.toString()) &&
        !existingUnitIds.includes(modifier.unit.toString())
      ) {
        unitIds.push(modifier.unit.toString())
      }
    }
    for (const weather of round.weathers) {
      if (!unitIds.includes(weather.unit.toString()) && !existingUnitIds.includes(weather.unit.toString())) {
        unitIds.push(weather.unit.toString())
      }
    }
  }

  return unitIds.length > 0
    ? UnitStore.get({
        ids: unitIds,
      })
    : []
}
