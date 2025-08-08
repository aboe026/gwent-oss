import { Logger } from 'log4js'

/**
 * A class to be extended for database upgrades
 */
export default abstract class Upgrade {
  static logger: Logger

  /**
   * Initialize a new instance of a Database Upgrade.
   */
  constructor() {}

  /**
   * The operations to be run for the upgrade
   */
  abstract run(): Promise<void>
}
