import log4js from 'log4js'

import CardStore from '../card-store'
import DbConnector from '../db-connector'

/**
 * Creates collection and indexes for Leader and Unit cards.
 */
export default async function upgrade1() {
  const logger = log4js.getLogger('upgrade-1')
  logger.debug('Connecting to database')
  const db = await DbConnector.connect()
  logger.debug(`Creating collection "${CardStore.COLLECTION_NAME}"`)
  await db.createCollection(CardStore.COLLECTION_NAME)
  logger.debug(`Creating index on collection "${CardStore.COLLECTION_NAME}" for type:1`)
  await db.createIndex(CardStore.COLLECTION_NAME, {
    type: 1,
  })
  logger.debug(`Creating index on collection "${CardStore.COLLECTION_NAME}" for name:1 unique`)
  await db.createIndex(
    CardStore.COLLECTION_NAME,
    {
      name: 1,
    },
    {
      unique: true,
    }
  )
}
