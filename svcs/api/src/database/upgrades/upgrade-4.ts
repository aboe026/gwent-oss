import { getLogger } from 'log4js'

import DbConnector from '../db-connector'
import DeckStore from '../stores/deck-store'
import Upgrade from './upgrade'

/**
 * Creates collection and indexes for Decks.
 */
export default class Upgrade4 extends Upgrade {
  static logger = getLogger('Upgrade4')

  async run() {
    Upgrade4.logger.debug('Connecting to database')
    const db = await DbConnector.connect()
    Upgrade4.logger.debug(`Creating collection "${DeckStore.COLLECTION_NAME}"`)
    await db.createCollection(DeckStore.COLLECTION_NAME)
    Upgrade4.logger.debug(`Creating index on collection "${DeckStore.COLLECTION_NAME}" for name:1,user:1 unique`)
    await db.createIndex(
      DeckStore.COLLECTION_NAME,
      {
        user: 1,
        name: 1,
      },
      {
        unique: true,
      }
    )
  }
}
