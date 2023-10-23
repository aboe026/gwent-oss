import { MongoClient } from 'mongodb'

import env from './env'

export default class E2eUtil {
  private static client: MongoClient | undefined = undefined

  static async setup(): Promise<void> {
    await E2eUtil.clearDb(env.MONGO_DB)
  }

  static async clearDb(dbName: string): Promise<void> {
    if (!E2eUtil.client) {
      E2eUtil.client = new MongoClient(env.MONGO_URL)
    }
    await E2eUtil.client.connect()
    const database = E2eUtil.client.db(dbName)
    const collections = await database.collections()
    for (const collection of collections) {
      await collection.deleteMany({})
    }
  }
}
