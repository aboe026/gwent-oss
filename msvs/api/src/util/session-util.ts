import { getLogger } from 'log4js'

import env from '../env'
import { getFileContents } from '@gwent-oss/node-utils'

/**
 * A class to help with Session management.
 */
export default class SessionUtil {
  private static logger = getLogger('SessionUtil')

  /**
   * Gets the session secret configured for the instance.
   *
   * @returns The secret the session has been encoded with.
   */
  static async getSessionSecret(): Promise<string> {
    SessionUtil.logger.trace(`SESSION_SECRET_FILE: "${env().SESSION_SECRET_FILE}"`)
    const sessionSecretFromFile = await getFileContents(env().SESSION_SECRET_FILE)
    return sessionSecretFromFile || env().SESSION_SECRET
  }
}
