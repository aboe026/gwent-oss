import log4js from 'log4js'
import { ObjectId } from 'mongodb'

import Store from './store'

export default class UpgradeStore extends Store {
  static readonly COLLECTION_NAME = 'upgrades'
  private static readonly LOCK_ID = new ObjectId('000000000000000000000001')
  private static logger = log4js.getLogger('upgrade-store')

  static async addLock(): Promise<LockDbObject> {
    const updated = new Date()
    UpgradeStore.logger.trace(`Adding lock with updated: "${updated}"`)
    return UpgradeStore.create<LockDbObject>({
      _id: UpgradeStore.LOCK_ID,
      updated,
    })
  }

  static async updateLock(): Promise<LockDbObject> {
    const updated = new Date()
    UpgradeStore.logger.trace(`Updating lock with updated: "${updated}"`)
    return UpgradeStore.update<LockDbObject>({
      _id: UpgradeStore.LOCK_ID,
      updated,
    })
  }

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

  static async deleteLock(): Promise<LockDbObject> {
    UpgradeStore.logger.trace('Deleting lock')
    return UpgradeStore.delete(UpgradeStore.LOCK_ID)
  }

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
