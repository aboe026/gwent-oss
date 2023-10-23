import DbConnector from '../../../src/database/db-connector'

export default class DbUtil {
  static async deleteDatabase() {
    const db = await DbConnector.connect()
    const dropped = await db.dropDatabase()
    if (!dropped) {
      throw Error('Could not delete database')
    }
  }

  static async cleanCollections() {
    const db = await DbConnector.connect()
    const collections = await db.listCollections().toArray()
    for (const collection of collections) {
      const col = db.collection(collection.name)
      await col.deleteMany()
    }
  }
}
