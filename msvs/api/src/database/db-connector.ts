import { ConnectionClosedEvent, Db, MongoClient } from 'mongodb'
import { ConnectionString } from 'connection-string'
import { getLogger } from 'log4js'

import env from '../env'
import { getFileContents } from '@gwent-oss/node-utils'

/**
 * A class for managing connections to a MongoDB instance.
 */
export default class DbConnector {
  private static client: MongoClient
  private static connected = false
  private static logger = getLogger('DbConnector')

  /**
   * Gets the MongoClient that has potentially been configured from initialization.
   *
   * @returns The MongoClient configured after initialization.
   */
  static getClient(): MongoClient {
    return DbConnector.client
  }

  /**
   * Generates the MongoDB URL, optionally overwriting the username and/or password.
   *
   * @param config The configuration used to generate the MongoDB URL.
   * @param config.url The URL to the MongoDB instance.
   * @param config.username An optional username to authenticate against the MongoDB instance with.
   * @param config.password An optional password to authenticate against the MongoDB instance with.
   * @returns The full MongoDB URL, with optional parameters overwriting if provided.
   */
  private static getMongoUrl({
    url,
    username,
    password,
  }: {
    url: string
    username?: string
    password?: string
  }): string {
    const mongoUrl = new URL(url)

    if (username) mongoUrl.username = username
    if (password) mongoUrl.password = password

    return mongoUrl.toString()
  }

  /**
   * Establish a connection with a MongoDB database.
   */
  private static async initialize() {
    const mongoUrl = DbConnector.getMongoUrl({
      url: env().MONGO_URL,
      username: await getFileContents(env().MONGO_USERNAME_FILE),
      password: await getFileContents(env().MONGO_PASSWORD_FILE),
    })
    DbConnector.logger.debug(
      `MongoDB URL: '${new ConnectionString(mongoUrl).toString({
        passwordHash: true,
      })}'`
    )
    DbConnector.logger.info(`Connecting to MongoDB database "${env().MONGO_DB}"`)
    DbConnector.client = await MongoClient.connect(mongoUrl)

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
