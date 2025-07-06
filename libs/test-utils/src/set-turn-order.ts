import { ObjectId } from 'mongodb'

import { GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import { getGame, updateGame } from './db-util'

/**
 * Sets the order of player turns for a game.
 *
 * @param config The configuration used to set the turn order of a game.
 * @param config.gameId The ID of the game to set the turn order for.
 * @param config.mongoConnectionString The MongoDB Connection String used to communicate with the database.
 * @param config.mongoDatabaseName The name of the MongoDB Database containing the game to modify.
 * @param config.userIds The IDs of the users in turn order.
 * @returns The game with turn orders set.
 */
export default async function setTurnOrder({
  gameId,
  mongoConnectionString,
  mongoDatabaseName,
  userIds,
}: {
  gameId: string | ObjectId
  mongoConnectionString: string
  mongoDatabaseName: string
  userIds: (string | ObjectId)[]
}): Promise<GameDbObject> {
  const game = await getGame({
    gameId,
    mongoConnectionString,
    mongoDatabaseName,
  })

  for (const gamePlayer of game.players) {
    gamePlayer.order = userIds.indexOf(gamePlayer.user.toString())
  }
  game.turn = new ObjectId(userIds[0])
  game.status = GameStatus.Redrawing

  return updateGame({
    game,
    mongoConnectionString,
    mongoDatabaseName,
  })
}
