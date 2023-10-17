import { ConnectionString } from 'connection-string'
import { ConnectionClosedEvent, Db, MongoClient } from 'mongodb'
import { getLogger } from 'log4js'

import env from '../env'

const logger = getLogger('db-connector')

export default class DbConnector {
  private static client: MongoClient
  private static connected = false

  private static async initialize() {
    logger.debug(
      `MONGO_URL: '${new ConnectionString(env.MONGO_URL).toString({
        passwordHash: true,
      })}'`
    )
    logger.info(`Connecting to MongoDB database "${env.MONGO_DB}"`)
    DbConnector.client = new MongoClient(env.MONGO_URL)

    DbConnector.client.on('connectionClosed', (event: ConnectionClosedEvent) => {
      logger.warn(`Lost connection to MongoDB database "${env.MONGO_DB}" due to "${event.reason}"`)
      DbConnector.connected = false
    })

    await DbConnector.client.connect()
    DbConnector.connected = true
  }

  static async connect(): Promise<Db> {
    if (logger.isTraceEnabled()) {
      if (!DbConnector.client) {
        logger.trace(`client: "${DbConnector.client}"`)
      }
      if (!DbConnector.connected) {
        logger.trace(`connected: "${DbConnector.connected}"`)
      }
    }
    if (!DbConnector.client || !DbConnector.connected) {
      logger.debug('Client not initialized or connecting, initializing')
      await DbConnector.initialize()
    }
    return DbConnector.client.db(env.MONGO_DB)
  }

  static async disconnect() {
    if (DbConnector.client && DbConnector.connected) {
      logger.info(`Disconnecting from MongoDB database "${env.MONGO_DB}"`)
      await DbConnector.client.close()
    }
  }
}
