import { MongoClient, ObjectId } from 'mongodb'

import { GameDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * Retrieves the desired game from the database.
 *
 * @param config The configuration used to retrieve the game.
 * @param config.gameId The ID of the game to retrieve.
 * @param config.mongoConnectionString The MongoDB Connection String used to communicate with the database.
 * @param config.mongoDatabaseName The name of the MongoDB Database containing the game to retrieve.
 * @returns The Game database object.
 */
export async function getGame({
  gameId,
  mongoConnectionString,
  mongoDatabaseName,
}: {
  gameId: string | ObjectId
  mongoConnectionString: string
  mongoDatabaseName: string
}): Promise<GameDbObject> {
  const mongoClient = await MongoClient.connect(mongoConnectionString)
  try {
    const db = await mongoClient.db(mongoDatabaseName)
    const collection = await db.collection('games')
    const game: GameDbObject | null = await collection.findOne<GameDbObject>({
      _id: new ObjectId(gameId),
    })
    if (!game) {
      throw Error(`Could not find game with ID "${gameId}"`)
    }
    return game
  } finally {
    await mongoClient.close()
  }
}

/**
 * Update a game in the database.
 *
 * @param config The configuration used to update the game.
 * @param config.game The Game database object to overwrite the database with.
 * @param config.mongoConnectionString The MongoDB Connection String used to communicate with the database.
 * @param config.mongoDatabaseName The name of the MongoDB Database containing the game to modify.
 * @returns The updated game.
 */
export async function updateGame({
  game,
  mongoConnectionString,
  mongoDatabaseName,
}: {
  game: GameDbObject
  mongoConnectionString: string
  mongoDatabaseName: string
}): Promise<GameDbObject> {
  const mongoClient = await MongoClient.connect(mongoConnectionString)
  try {
    const db = await mongoClient.db(mongoDatabaseName)
    const collection = await db.collection('games')
    const updatedGame = await collection.findOneAndUpdate(
      {
        _id: new ObjectId(game._id),
      },
      {
        $set: game,
      }
    )
    return updatedGame as GameDbObject
  } finally {
    await mongoClient.close()
  }
}
