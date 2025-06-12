import { GameDbObject, GameUnitDbObject } from '@gwent/graphql-schema/database-typings'
import { ObjectId } from 'mongodb'

export default function getGameUnit({
  game,
  unitId,
  userId,
}: {
  game: GameDbObject
  unitId: ObjectId
  userId?: string
}): GameUnitDbObject | undefined {
  if (userId) {
    const players = game.players.filter((player) => player.user.toString() === userId)
    if (players.length === 0) {
      throw Error(`Could not find player "${userId}" on game "${game._id}"`)
    } else if (players.length > 1) {
      throw Error(`Found more than 1 player with ID "${userId}" on game "${game._id}": "${JSON.stringify(players)}"`)
    }
    const playerRound = players[0].rounds[game.round - 1]
    const units = [...playerRound.close.units, ...playerRound.ranged.units, ...playerRound.siege.units]
    for (const unit of units) {
      if (unit.unit.toString() === unitId.toString()) {
        return unit
      }
    }
  }
}
