import { getLogger } from 'log4js'

import DbConnector from '../db-connector'
import UserStore from '../stores/user-store'
import Upgrade from './upgrade'

/**
 * Creates collection and indexes for Users.
 */
export default class Upgrade3 extends Upgrade {
  static logger = getLogger('Upgrade3')

  /**
   * Run this upgrade operations against the database.
   */
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
