import { ConnectionString } from 'connection-string'
import { ConnectionClosedEvent, Db, MongoClient } from 'mongodb'
import { getLogger } from 'log4js'

import env from '../env'

/**
 * A class for managing connections to a MongoDB instance.
 */
export default class DbConnector {
  private static client: MongoClient
  private static connected = false
  private static logger = getLogger('db-connector')

  /**
   * Establish a connection with a MongoDB database.
   */
  private static async initialize() {
    DbConnector.logger.debug(
      `MONGO_URL: '${new ConnectionString(env().MONGO_URL).toString({
        passwordHash: true,
      })}'`
    )
    DbConnector.logger.info(`Connecting to MongoDB database "${env().MONGO_DB}"`)
    DbConnector.client = await MongoClient.connect(env().MONGO_URL)

    DbConnector.client.on('connectionClosed', (event: ConnectionClosedEvent) => {
      DbConnector.logger.warn(`Lost connection to MongoDB database "${env().MONGO_DB}" due to "${event.reason}"`)
      DbConnector.connected = false
    })

    DbConnector.connected = true
  }

  /**
   * Ensure a connection to a MongoDB database is in place.
   *
   * @returns The MongoDB Database object.
   */
  static async connect(): Promise<Db> {
    if (DbConnector.logger.isTraceEnabled()) {
      if (!DbConnector.client) {
        DbConnector.logger.trace(`client: "${DbConnector.client}"`)
      }
      if (!DbConnector.connected) {
        DbConnector.logger.trace(`connected: "${DbConnector.connected}"`)
      }
    }
    if (!DbConnector.client || !DbConnector.connected) {
      DbConnector.logger.debug('Client not initialized or connecting, initializing')
      await DbConnector.initialize()
    }
    return DbConnector.client.db(env().MONGO_DB)
  }

  /**
   * Remove connection to the MongoDB database if previously established.
   */
  static async disconnect() {
    if (DbConnector.client && DbConnector.connected) {
      DbConnector.logger.info(`Disconnecting from MongoDB database "${env().MONGO_DB}"`)
      await DbConnector.client.close()
    }
  }
}
