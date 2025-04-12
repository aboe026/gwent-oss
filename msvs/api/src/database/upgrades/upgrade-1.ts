import { getLogger } from 'log4js'

import DbConnector from '../db-connector'
import DlcStore from '../stores/dlc-store'
import EffectStore from '../stores/effect-store'
import FactionStore from '../stores/faction-store'
import LeaderStore from '../stores/leader-store'
import UnitStore from '../stores/unit-store'
import Upgrade from './upgrade'

/**
 * Creates collection and indexes for resources.
 */
export default class Upgrade1 extends Upgrade {
  static logger = getLogger('Upgrade1')

  async run() {
    Upgrade1.logger.debug('Connecting to database')
    const db = await DbConnector.connect()

    // DLCs
    Upgrade1.logger.debug(`Creating collection "${DlcStore.COLLECTION_NAME}"`)
    await db.createCollection(DlcStore.COLLECTION_NAME)
    Upgrade1.logger.debug(`Creating index on collection "${DlcStore.COLLECTION_NAME}" for name:1 unique`)
    await db.createIndex(
      DlcStore.COLLECTION_NAME,
      {
        name: 1,
      },
      {
        unique: true,
      }
    )
    Upgrade1.logger.debug(`Creating index on collection "${DlcStore.COLLECTION_NAME}" for key:1 unique`)
    await db.createIndex(
      DlcStore.COLLECTION_NAME,
      {
        key: 1,
      },
      {
        unique: true,
      }
    )

    // Effects
    Upgrade1.logger.debug(`Creating collection "${EffectStore.COLLECTION_NAME}"`)
    await db.createCollection(EffectStore.COLLECTION_NAME)
    Upgrade1.logger.debug(`Creating index on collection "${EffectStore.COLLECTION_NAME}" for name:1 unique`)
    await db.createIndex(
      EffectStore.COLLECTION_NAME,
      {
        name: 1,
      },
      {
        unique: true,
      }
    )
    Upgrade1.logger.debug(`Creating index on collection "${EffectStore.COLLECTION_NAME}" for key:1 unique`)
    await db.createIndex(
      EffectStore.COLLECTION_NAME,
      {
        key: 1,
      },
      {
        unique: true,
      }
    )

    // Factions
    Upgrade1.logger.debug(`Creating collection "${FactionStore.COLLECTION_NAME}"`)
    await db.createCollection(FactionStore.COLLECTION_NAME)
    Upgrade1.logger.debug(`Creating index on collection "${FactionStore.COLLECTION_NAME}" for name:1 unique`)
    await db.createIndex(
      FactionStore.COLLECTION_NAME,
      {
        name: 1,
      },
      {
        unique: true,
      }
    )
    Upgrade1.logger.debug(`Creating index on collection "${FactionStore.COLLECTION_NAME}" for key:1 unique`)
    await db.createIndex(
      FactionStore.COLLECTION_NAME,
      {
        key: 1,
      },
      {
        unique: true,
      }
    )

    // Leaders
    Upgrade1.logger.debug(`Creating collection "${LeaderStore.COLLECTION_NAME}"`)
    await db.createCollection(LeaderStore.COLLECTION_NAME)
    Upgrade1.logger.debug(`Creating index on collection "${LeaderStore.COLLECTION_NAME}" for name:1 unique`)
    await db.createIndex(
      LeaderStore.COLLECTION_NAME,
      {
        name: 1,
      },
      {
        unique: true,
      }
    )
    Upgrade1.logger.debug(`Creating index on collection "${LeaderStore.COLLECTION_NAME}" for faction:1`)
    await db.createIndex(LeaderStore.COLLECTION_NAME, {
      faction: 1,
    })

    // Units
    Upgrade1.logger.debug(`Creating collection "${UnitStore.COLLECTION_NAME}"`)
    await db.createCollection(UnitStore.COLLECTION_NAME)
    Upgrade1.logger.debug(`Creating index on collection "${UnitStore.COLLECTION_NAME}" for faction:1,deckable:1`)
    await db.createIndex(UnitStore.COLLECTION_NAME, {
      faction: 1,
      deckable: 1,
    })
    Upgrade1.logger.debug(
      `Creating index on collection "${UnitStore.COLLECTION_NAME}" for name:1,_id:1 with collation locale:en`
    )
    await db.createIndex(
      UnitStore.COLLECTION_NAME,
      {
        name: 1,
        _id: 1,
      },
      {
        collation: {
          locale: 'en',
        },
      }
    )
  }
}
