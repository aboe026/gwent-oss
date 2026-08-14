import { getLogger } from 'log4js'
import { ObjectId, WithoutId } from 'mongodb'

import Store from './store'

/**
 * A class for interacting with database documents containing information about database upgrades.
 */
export default class UpgradeStore extends Store {
  static readonly COLLECTION_NAME = 'upgrades'
  private static readonly LOCK_ID = new ObjectId('000000000000000000000001')
  private static logger = getLogger('UpgradeStore')

  /**
   * Attempts to create a lock on the database for upgrades. Throws an error if a lock already exists.
   *
   * @returns The database lock document.
   * @throws {Error} if lock already exists.
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
   * Get the database lock document.
   *
   * @returns The database lock document or null if one does not exist.
   */
  static async getLock(): Promise<LockDbObject | null> {
    const lock = await UpgradeStore.readOne<LockDbObject>({
      filter: {
        _id: UpgradeStore.LOCK_ID,
      },
    })
    if (UpgradeStore.logger.isTraceEnabled()) {
      UpgradeStore.logger.trace(`getLock lock: "${JSON.stringify(lock)}"`)
    }
    return lock
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
   * @throws {Error} if more than 1 version found.
   */
  static async getCurrentVersion(): Promise<number> {
    const upgrade = await UpgradeStore.readOne<UpgradeDbObject>({
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
      UpgradeStore.logger.trace(`getCurrentVersion upgrade: "${JSON.stringify(upgrade)}"`)
    }
    return upgrade === null ? 0 : upgrade.version
  }

  /**
   * Adds an upgrade attempt document to the database.
   *
   * @param config The configuration used to add the Attempt.
   * @param config.version The upgrade version the attempt is trying to run.
   * @param config.time The timestamp the attempt was made.
   * @returns The attempt database document.
   */
  static async addAttempt({ version, time }: { version: number; time: Date }): Promise<AttemptDbObject> {
    const attempt: WithoutId<AttemptDbObject> = {
      version,
      time,
    }
    if (UpgradeStore.logger.isTraceEnabled()) {
      UpgradeStore.logger.trace(`addAttempt doc: "${JSON.stringify(attempt)}"`)
    }
    return UpgradeStore.create<AttemptDbObject>(attempt)
  }

  /**
   * Gets all upgrade attempt documents.
   *
   * @returns All upgrade attempt documents, sorted by time descending.
   */
  static async getAttempts(): Promise<AttemptDbObject[]> {
    return UpgradeStore.readMany<AttemptDbObject[]>({
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
   * @param config The configuration used to add the Upgrade.
   * @param config.version The upgrade version the database was successfully upgraded to.
   * @param config.start The time the upgrade was started.
   * @param config.end The time the upgrade finished.
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
    const upgrade: WithoutId<UpgradeDbObject> = {
      version,
      start,
      end,
    }
    if (UpgradeStore.logger.isTraceEnabled()) {
      UpgradeStore.logger.trace(`addUpgrade doc: "${JSON.stringify(upgrade)}"`)
    }
    return UpgradeStore.create<UpgradeDbObject>(upgrade)
  }

  /**
   * Gets all successful database upgrade documents.
   *
   * @returns All successful upgrade documents, sorted by time descending.
   */
  static async getUpgrades(): Promise<UpgradeDbObject[]> {
    return UpgradeStore.readMany<UpgradeDbObject[]>({
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
