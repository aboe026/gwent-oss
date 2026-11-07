import { Db } from 'mongodb'
import { getLogger } from 'log4js'

import DbConnector from '../db-connector'
import DeckStore from '../stores/deck-store'
import DlcStore from '../stores/dlc-store'
import EffectStore from '../stores/effect-store'
import FactionStore from '../stores/faction-store'
import LeaderStore from '../stores/leader-store'
import UnitStore from '../stores/unit-store'
import Upgrade from './upgrade'
import UserStore from '../stores/user-store'

/**
 * Adds the "updated" field to collections missing it.
 */
export default class Upgrade6 extends Upgrade {
  static logger = getLogger('Upgrade6')

  /**
   * Run these upgrade operations against the database.
   */
  async run() {
    Upgrade6.logger.debug('Connecting to database')
    const db = await DbConnector.connect()
    Upgrade6.logger.debug('Adding "updated" field to documents')

    await Upgrade6.setCreateds(db, DeckStore.COLLECTION_NAME)
    await Upgrade6.setCreateds(db, DlcStore.COLLECTION_NAME)
    await Upgrade6.setCreateds(db, EffectStore.COLLECTION_NAME)
    await Upgrade6.setCreateds(db, FactionStore.COLLECTION_NAME)
    await Upgrade6.setCreateds(db, LeaderStore.COLLECTION_NAME)
    await Upgrade6.setCreateds(db, UnitStore.COLLECTION_NAME)
    await Upgrade6.setCreateds(db, UserStore.COLLECTION_NAME)
  }

  /**
   * Adds an "updated" field to all documents in a collection whose value is equal to their "created" field
   *
   * @param db The Database instance to perform operations against.
   * @param collectionName The name of the collection whose documents should get updated.
   */
  private static async setCreateds(db: Db, collectionName: string): Promise<void> {
    Upgrade6.logger.trace(`Setting "updated" field equal to "created" field for "${collectionName}" documents`)
    await db.collection(collectionName).updateMany({}, [
      {
        $set: {
          updated: '$created',
        },
      },
    ])
  }
}
