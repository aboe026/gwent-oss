import log4js from 'log4js'

import DbConnector from '../db-connector'
import UserStore from '../user-store'

/**
 * Creates collection and indexes for Users.
 */
export default async function upgrade3() {
  const logger = log4js.getLogger('upgrade-3')
  logger.debug('Connecting to database')
  const db = await DbConnector.connect()
  logger.debug(`Creating collection "${UserStore.COLLECTION_NAME}"`)
  await db.createCollection(UserStore.COLLECTION_NAME)
  logger.debug(`Creating index on collection "${UserStore.COLLECTION_NAME}" for name:1 unique`)
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
