import { ObjectId } from 'mongodb'

import { Combat, GameDbObject, GameUnitDbObject } from '@gwent/graphql-schema/database-typings'

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
    unitId: ObjectId
    userId: string
  }): BattlefieldUnit | undefined {
    const players = game.players.filter((player) => player.user.toString() === userId)
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
      }) ||
      GetBattlefieldUnit.getRowUnit({
        row: Combat.Ranged,
        unitId,
        units: playerRound.ranged.units,
      }) ||
      GetBattlefieldUnit.getRowUnit({
        row: Combat.Siege,
        unitId,
        units: playerRound.siege.units,
      })
    )
  }

  private static getRowUnit({
    unitId,
    units,
    row,
  }: {
    unitId: ObjectId
    units: GameUnitDbObject[]
    row: Combat
  }): BattlefieldUnit | undefined {
    for (const unit of units) {
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
