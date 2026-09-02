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
    const sessionSecretFile = env().SESSION_SECRET_FILE
    SessionUtil.logger.trace(`SESSION_SECRET_FILE: "${sessionSecretFile}"`)
    const sessionSecretFromFile = await getFileContents(sessionSecretFile)
    if (sessionSecretFromFile) {
      SessionUtil.logger.debug('Using session secret from file')
      return sessionSecretFromFile
    } else {
      SessionUtil.logger.debug('Using session secret from environment variable')
      return env().SESSION_SECRET
    }
  }
}
