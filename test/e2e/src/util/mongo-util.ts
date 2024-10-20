import { Db, MongoClient } from 'mongodb'

import env from './env'

export default class MongoUtil {
  private static client: MongoClient
  private static connected = false

  private static async initialize() {
    MongoUtil.client = await MongoClient.connect(env.MONGO_URL)
    MongoUtil.client.on('connectionClosed', () => {
      MongoUtil.connected = false
    })
    MongoUtil.connected = true
  }

  static async connect(): Promise<Db> {
    if (!MongoUtil.client || !MongoUtil.connected) {
      await MongoUtil.initialize()
    }
    return MongoUtil.client.db(env.MONGO_DB)
  }

  static async disconnect() {
    if (MongoUtil.client && MongoUtil.connected) {
      await MongoUtil.client.close()
    }
  }
}
