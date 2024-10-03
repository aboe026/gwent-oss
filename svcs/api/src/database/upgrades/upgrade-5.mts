import log4js from 'log4js'

import DbConnector from '../db-connector.mjs'
import GameStore from '../stores/game-store.mjs'
import Upgrade from './upgrade.mjs'

/**
 * Creates collection and indexes for Games.
 */
export default class Upgrade5 extends Upgrade {
  static logger = log4js.getLogger('upgrade-5')

  async run() {
    Upgrade5.logger.debug('Connecting to database')
    const db = await DbConnector.connect()
    Upgrade5.logger.debug(`Creating collection "${GameStore.COLLECTION_NAME}"`)
    await db.createCollection(GameStore.COLLECTION_NAME)
    Upgrade5.logger.debug(`Creating index on collection "${GameStore.COLLECTION_NAME}" for players.user:1`)
    await db.createIndex(GameStore.COLLECTION_NAME, {
      'players.user': 1,
    })
  }
}
