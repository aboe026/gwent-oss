import { ObjectId } from 'mongodb'

import {
  FieldUnitDbObject,
  GameDbObject,
  UnitDbObject,
  WeatherUnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import UnitStore from '../../../../database/stores/unit-store'

/**
 * Gets all Units on the battlefield in the current round of the game from the database.
 *
 * @param config The configuration used to get the Units.
 * @param config.game The game whose currently deployed battlefield units on the current round should be retreived.
 * @param config.unitBeingPlayed The current unit being played and for which the database object has already been retreived, making it unnecessary to retreive it again.
 * @param config.units Any potential Unit objects which have already been retrieved.
 * @param config.playerId A potential player ID to scope round units to. If not specified, will get round units for all players.
 * @param config.round The round of the game to get Units for. If not provided, will be current round of the game.
 * @returns An array of all database Units on the battlefield in the current round of the game, including the unitBeingPlayed.
 */
export default async function getRoundUnits({
  game,
  unitBeingPlayed,
  units,
  playerId,
  round,
}: {
  game: GameDbObject
  unitBeingPlayed?: UnitDbObject
  units?: UnitDbObject[]
  playerId?: ObjectId
  round?: number
}): Promise<UnitDbObject[]> {
  const unitIdsToRetrieve: string[] = []
  const gameRound = round === undefined ? game.round - 1 : round
  const roundUnits: UnitDbObject[] = []

  for (const player of game.players) {
    if (!playerId || player.user.toString() === playerId.toString()) {
      const round = player.rounds[gameRound]
      const gameUnits: (FieldUnitDbObject | WeatherUnitDbObject)[] = [
        ...round.close.units,
        ...round.ranged.units,
        ...round.siege.units,
        ...round.weathers,
      ]
      for (const modifier of [round.close.modifier, round.ranged.modifier, round.siege.modifier]) {
        if (modifier) {
          gameUnits.push(modifier)
        }
      }

      for (const gameUnit of gameUnits) {
        if (gameUnit.unit.toString() === unitBeingPlayed?._id.toString()) {
          roundUnits.push(unitBeingPlayed)
        } else {
          const unitsIndex = (units || []).findIndex((unit) => unit._id.toString() === gameUnit.unit.toString())
          if (units && unitsIndex >= 0) {
            roundUnits.push(units[unitsIndex])
          } else if (!unitIdsToRetrieve.includes(gameUnit.unit.toString())) {
            unitIdsToRetrieve.push(gameUnit.unit.toString())
          }
        }
      }
    }
  }

  if (unitIdsToRetrieve.length > 0) {
    roundUnits.push(
      ...(await UnitStore.get({
        ids: unitIdsToRetrieve,
      }))
    )
  }
  return roundUnits
}
