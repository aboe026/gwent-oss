import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import Store from './store'

/**
 * A class for interacting with database documents containing information about database upgrades.
 */
export default class UpgradeStore extends Store {
  static readonly COLLECTION_NAME = 'upgrades'
  private static readonly LOCK_ID = new ObjectId('000000000000000000000001')
  private static logger = getLogger('upgrade-store')

  /**
   * Attempts to create a lock on the database for upgrades. Throws an error if a lock already exists.
   *
   * @returns The database lock document.
   * @throws Error if lock already exists.
   */
  static async addLock(): Promise<LockDbObject> {
    const updated = new Date()
    UpgradeStore.logger.trace(`Adding lock with updated: "${updated}"`)
    return UpgradeStore.create<LockDbObject>({
      _id: UpgradeStore.LOCK_ID,
      updated,
    })
  }

  /**
   * Update the "updated" field on the database lock. Needed to prevent the lock from expiring.
   *
   * @returns The database lock document with its refreshed "updated" field.
   */
  static async updateLock(): Promise<LockDbObject> {
    const updated = new Date()
    UpgradeStore.logger.trace(`Updating lock with updated: "${updated}"`)
    return UpgradeStore.update<LockDbObject>({
      filter: {
        _id: UpgradeStore.LOCK_ID,
      },
      update: {
        $set: {
          updated,
        },
      },
    })
  }

  /**
   * Get the database lock document. Throws an error if somehow more than 1 exists in the database.
   *
   * @returns The database lock document.
   * @throws Error if more than 1 lock found.
   */
  static async getLock(): Promise<LockDbObject> {
    const docs = await UpgradeStore.read<LockDbObject[]>({
      filter: {
        _id: UpgradeStore.LOCK_ID,
      },
    })
    if (UpgradeStore.logger.isTraceEnabled()) {
      UpgradeStore.logger.trace(`getLock docs: "${JSON.stringify(docs)}"`)
    }
    if (docs.length > 1) {
      throw Error(`More than 1 upgrade lock document found: "${JSON.stringify(docs)}"`)
    }
    return docs[0]
  }

  /**
   * Remove the lock document from the database.
   *
   * @returns The lock document from the database if it exists.
   */
  static async deleteLock(): Promise<LockDbObject> {
    UpgradeStore.logger.trace('Deleting lock')
    return UpgradeStore.delete(UpgradeStore.LOCK_ID)
  }

  /**
   * Gets the current version of the database in terms of how many upgrades has successfully been run.
   *
   * @returns The current upgrade version of the database.
   * @throws Error if more than 1 version found.
   */
  static async getCurrentVersion(): Promise<number> {
    const docs = await UpgradeStore.read<UpgradeDbObject[]>({
      filter: {
        end: {
          $exists: true,
        },
      },
      options: {
        sort: {
          version: -1,
        },
        limit: 1,
      },
    })
    if (UpgradeStore.logger.isTraceEnabled()) {
      UpgradeStore.logger.trace(`getCurrentVersion docs: "${JSON.stringify(docs)}"`)
    }
    if (docs.length > 1) {
      throw Error(`More than 1 doc returned for current upgrade version: "${JSON.stringify(docs)}"`)
    }
    return docs && docs.length ? docs[0]?.version : 0
  }

  /**
   * Adds an upgrade attempt document to the database.
   *
   * @param {Object} attempt The upgrade attempt to add.
   * @param attempt.version The upgrade version the attempt is trying to run.
   * @returns The attempt database document.
   */
  static async addAttempt({ version, time }: { version: number; time: Date }): Promise<AttemptDbObject> {
    const doc = {
      version,
      time,
    }
    if (UpgradeStore.logger.isTraceEnabled()) {
      UpgradeStore.logger.trace(`addAttempt doc: "${JSON.stringify(doc)}"`)
    }
    return UpgradeStore.create<AttemptDbObject>(doc)
  }

  /**
   * Gets all upgrade attempt documents.
   *
   * @returns All upgrade attempt documents, sorted by time descending.
   */
  static async getAttempts(): Promise<AttemptDbObject[]> {
    return UpgradeStore.read<AttemptDbObject[]>({
      filter: {
        time: {
          $exists: true,
        },
      },
      options: {
        sort: {
          time: -1,
        },
      },
    })
  }

  /**
   * Adds an upgrade document to the database.
   *
   * @param upgrade The upgrade document to add.
   * @param version The upgrade version the database was successfully upgraded to.
   * @param start The time the upgrade was started.
   * @param end The time the upgrade finished.
   * @returns The upgrade database document.
   */
  static async addUpgrade({
    version,
    start,
    end,
  }: {
    version: number
    start: Date
    end: Date
  }): Promise<UpgradeDbObject> {
    const doc = {
      version,
      start,
      end,
    }
    if (UpgradeStore.logger.isTraceEnabled()) {
      UpgradeStore.logger.trace(`addUpgrade doc: "${JSON.stringify(doc)}"`)
    }
    return UpgradeStore.create<UpgradeDbObject>(doc)
  }

  /**
   * Gets all successful database upgrade documents.
   *
   * @returns All successful upgrade documents, sorted by time descending.
   */
  static async getUpgrades(): Promise<UpgradeDbObject[]> {
    return UpgradeStore.read<UpgradeDbObject[]>({
      filter: {
        end: {
          $exists: true,
        },
      },
      options: {
        sort: {
          version: -1,
        },
      },
    })
  }
}

export type LockDbObject = {
  _id: ObjectId
  updated: Date
}

export type AttemptDbObject = {
  _id: ObjectId
  version: number
  time: Date
}

export type UpgradeDbObject = {
  _id: ObjectId
  version: number
  start: Date
  end: Date
}
