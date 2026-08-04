import { ObjectId } from 'mongodb'

import {
  Combat,
  FieldUnitDbObject,
  GameDbObject,
  PlayerCombatRowDbObject,
  PlayerRoundDbObject,
} from '@gwent-oss/graphql-schema/database-typings'

/**
 * A class to get FieldUnits that are currently on a Game battlefield.
 */
export default class GetFieldUnits {
  /**
   * Get a FieldUnit if it is on the battlefield.
   *
   * @param config The configuration used to get the FieldUnit.
   * @param config.game The Game to search the battlefield for the FieldUnit.
   * @param config.unitId The ID of the FieldUnit to find on the battlefield of the game.
   * @param config.userId The ID of the User to scope the search for the FieldUnit to.
   * @returns The FieldUnit if it exists on the battlefield.
   */
  static getFieldUnit({
    game,
    unitId,
    userId,
  }: {
    game: GameDbObject
    unitId: ObjectId | string
    userId: ObjectId | string
  }): FieldUnitDbObject | undefined {
    const players = game.players.filter((player) => player.user.toString() === userId.toString())
    if (players.length === 0) {
      throw Error(`Could not find player "${userId}" on game "${game._id}"`)
    } else if (players.length > 1) {
      throw Error(`Found more than 1 player with ID "${userId}" on game "${game._id}": "${JSON.stringify(players)}"`)
    }
    const playerRound = players[0].rounds[game.round - 1]

    const fieldUnits = [
      ...GetFieldUnits.fromRow({
        row: playerRound.close,
      }),
      ...GetFieldUnits.fromRow({
        row: playerRound.ranged,
      }),
      ...GetFieldUnits.fromRow({
        row: playerRound.siege,
      }),
    ]
    return fieldUnits.find((fieldUnit) => fieldUnit.unit.toString() === unitId.toString())
  }

  /**
   * Get all the FieldUnits from a player combat row.
   *
   * @param config The configuration used to get the FieldUnits.
   * @param config.row The player combat row to get all field units for.
   * @returns All the FieldUnits in a player combat row.
   */
  static fromRow({ row }: { row: PlayerCombatRowDbObject }): FieldUnitDbObject[] {
    const units = [...row.units]
    if (row.modifier) {
      units.push(row.modifier)
    }
    return units
  }

  /**
   * Retrieve all the FieldUnit database documents that are currently on the battlefield from the given player rounds in a game.
   *
   * @param config The configuration used to get all FieldUnit database documents.
   * @param config.combat An optional combat type to limit results to.
   * @param config.rounds The Rounds of Game Players to get FieldUnits for.
   * @returns A list of all FieldUnit database objects which are currently on the battlefield for the given player rounds in a game.
   */
  static fromRounds({
    combat,
    rounds,
  }: {
    combat?: string | null
    rounds: PlayerRoundDbObject[]
  }): FieldUnitDbObject[] {
    const fieldUnits: FieldUnitDbObject[] = []

    for (const round of rounds) {
      if (!combat || combat === Combat.Close) {
        fieldUnits.push(
          ...GetFieldUnits.fromRow({
            row: round.close,
          })
        )
      }
      if (!combat || combat === Combat.Ranged) {
        fieldUnits.push(
          ...GetFieldUnits.fromRow({
            row: round.ranged,
          })
        )
      }
      if (!combat || combat === Combat.Siege) {
        fieldUnits.push(
          ...GetFieldUnits.fromRow({
            row: round.siege,
          })
        )
      }
    }

    return fieldUnits
  }
}
