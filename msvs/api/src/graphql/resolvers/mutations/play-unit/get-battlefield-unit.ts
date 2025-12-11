import { ObjectId } from 'mongodb'

import { Combat, GameDbObject, GameUnitDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * A class to get Units that are currently on a Game battlefield.
 */
export default class GetBattlefieldUnit {
  /**
   * Get a unit if it is on the battlefield.
   *
   * @param config The configuration used to get the battlefield unit.
   * @param config.game The Game to search the battlefield for the unit.
   * @param config.unitId The ID of the Unit to find on the battlefield of the game.
   * @param config.userId The ID of the User to scope the search for the battlefield unit to.
   * @returns The unit if it exists on the battlefield.
   */
  static getBattlefieldUnit({
    game,
    unitId,
    userId,
  }: {
    game: GameDbObject
    unitId: ObjectId | string
    userId: ObjectId | string
  }): BattlefieldUnit | undefined {
    const players = game.players.filter((player) => player.user.toString() === userId.toString())
    if (players.length === 0) {
      throw Error(`Could not find player "${userId}" on game "${game._id}"`)
    } else if (players.length > 1) {
      throw Error(`Found more than 1 player with ID "${userId}" on game "${game._id}": "${JSON.stringify(players)}"`)
    }
    const playerRound = players[0].rounds[game.round - 1]
    return (
      GetBattlefieldUnit.getRowUnit({
        row: Combat.Close,
        unitId,
        units: playerRound.close.units,
        modifier: playerRound.close.modifier,
      }) ||
      GetBattlefieldUnit.getRowUnit({
        row: Combat.Ranged,
        unitId,
        units: playerRound.ranged.units,
        modifier: playerRound.ranged.modifier,
      }) ||
      GetBattlefieldUnit.getRowUnit({
        row: Combat.Siege,
        unitId,
        units: playerRound.siege.units,
        modifier: playerRound.siege.modifier,
      })
    )
  }

  /**
   * Get a Unit from a battlefield row, as well as the row it was in.
   *
   * @param config The configuration used to get the battlefield unit.
   * @param config.unitId The ID of the unit to get from the battlefield.
   * @param config.units All of the units in a row on the battlefield.
   * @param config.row The row the battlefield units are in.
   * @param config.modifier The modifier that has potentially been set for the row on the battlefield.
   * @returns The battlefield unit if it exists in the given row.
   */
  private static getRowUnit({
    unitId,
    units,
    row,
    modifier,
  }: {
    unitId: ObjectId | string
    units: GameUnitDbObject[]
    modifier?: GameUnitDbObject | undefined
    row: Combat
  }): BattlefieldUnit | undefined {
    const allUnits = [...units]
    if (modifier) {
      allUnits.push(modifier)
    }
    for (const unit of allUnits) {
      if (unit.unit.toString() === unitId.toString()) {
        return {
          unit,
          row,
        }
      }
    }
  }
}

export interface BattlefieldUnit {
  unit: GameUnitDbObject
  row: Combat
}
