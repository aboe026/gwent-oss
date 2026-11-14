import { getLogger } from 'log4js'

import AdminDb from './admin-db'
import DbConnector from '../db-connector'
import semver from 'semver'
import Upgrade from './upgrade'

/**
 * Updates the Feature Compatibility Version (FCV) of the MongoDB instance to be "9.0".
 */
export default class Upgrade6 extends Upgrade {
  static logger = getLogger('Upgrade5')

  /**
   * Run these upgrade operations against the database.
   */
  async run() {
    Upgrade6.logger.debug('Connecting to database')
    await DbConnector.connect()

    const desiredFcv = '9.0'
    Upgrade6.logger.debug('Getting current FCV')
    const currentFcv = await AdminDb.getFeatureCompatibilityVersion()
    Upgrade6.logger.trace(`currentFcv: "${currentFcv}"`)

    if (semver.lt(`${currentFcv}.0`, `${desiredFcv}.0`)) {
      Upgrade6.logger.debug(
        `Current FCV "${currentFcv}" is less than desired FCV "${desiredFcv}", checking Database version for ability to automatically upgrade FCV`
      )
      const currentDbVersion = await AdminDb.getDatabaseVersion()
      Upgrade6.logger.trace(`currentDbVersion: "${currentDbVersion}"`)

      if (semver.lt(currentDbVersion, `${desiredFcv}.0`)) {
        const message = `Current MongoDB database version "${currentDbVersion}" is less than the required version of "${desiredFcv}". Upgrade MongoDB instance to proceed.`
        Upgrade6.logger.error(message)
        throw Error(message)
      }

      Upgrade6.logger.debug(`Upgrading FCV from "${currentFcv}" to "${desiredFcv}"`)
      await AdminDb.setFeatureCompatibilityVersion(desiredFcv)
    } else {
      Upgrade6.logger.debug(
        `Current FCV "${currentFcv}" not less than desired FCV of "${desiredFcv}", no upgrade necessary`
      )
    }
  }
}
