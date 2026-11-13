import { getLogger } from 'log4js'

import DbConnector from '../db-connector'

/**
 * Class to interact with the "admin" database of a MongoDB instance.
 */
export default class AdminDb {
  static readonly DATABASE_NAME = 'admin'
  private static logger = getLogger('AdminDb')

  /**
   * Get the version of MongoDB that is installed on the instance interacting with.
   *
   * @returns The version of MongoDB, as a semver (e.g. "9.0.8")
   */
  static async getDatabaseVersion(): Promise<string> {
    const adminDb = DbConnector.getClient().db(AdminDb.DATABASE_NAME)
    const result = await adminDb.command({ buildInfo: 1 })

    if (AdminDb.logger.isTraceEnabled()) {
      AdminDb.logger.trace(`getDatabaseVersion result: "${JSON.stringify(result)}"`)
    }

    return result.version
  }

  /**
   * Get the current Feature Compatibility Version set on the MongoDB instance.
   *
   * @returns The FCV, as a "<major>.<minor>" string (e.g. "9.8")
   */
  static async getFeatureCompatibilityVersion(): Promise<string> {
    const adminDb = DbConnector.getClient().db(AdminDb.DATABASE_NAME)
    const result = await adminDb.command({
      getParameter: 1,
      featureCompatibilityVersion: 1,
    })

    if (AdminDb.logger.isTraceEnabled()) {
      AdminDb.logger.trace(`getFeatureCompatibilityVersion result: "${JSON.stringify(result)}"`)
    }

    return result.featureCompatibilityVersion.version
  }

  /**
   * Set the Feature Compatibility Version for the MongoDB instance.
   *
   * @param version The FCV to set on the instance, as a "<major>.<minor>" string (e.g. "9.8")
   */
  static async setFeatureCompatibilityVersion(version: string): Promise<undefined> {
    const adminDb = DbConnector.getClient().db(AdminDb.DATABASE_NAME)
    const result = await adminDb.command({
      setFeatureCompatibilityVersion: version,
      confirm: true,
    })

    if (AdminDb.logger.isTraceEnabled()) {
      AdminDb.logger.trace(`setFeatureCompatibilityVersion result: "${JSON.stringify(result)}"`)
    }

    if (result.ok !== 1) {
      const message = 'Could not update FCV'
      AdminDb.logger.error(`${message}, result: "${JSON.stringify(result)}"`)
      throw Error(`${message}.`)
    }
  }
}
