import log4js from 'log4js'

import DbConnector from '../db-connector.mjs'
import UserStore from '../stores/user-store.mjs'
import Upgrade from './upgrade.mjs'

/**
 * Creates collection and indexes for Users.
 */
export default class Upgrade3 extends Upgrade {
  static logger = log4js.getLogger('upgrade-3')

  async run() {
    Upgrade3.logger.debug('Connecting to database')
    const db = await DbConnector.connect()
    Upgrade3.logger.debug(`Creating collection "${UserStore.COLLECTION_NAME}"`)
    await db.createCollection(UserStore.COLLECTION_NAME)
    Upgrade3.logger.debug(`Creating index on collection "${UserStore.COLLECTION_NAME}" for name:1 unique`)
    await db.createIndex(
      UserStore.COLLECTION_NAME,
      {
        name: 1,
      },
      {
        unique: true,
      }
    )
  }
}
