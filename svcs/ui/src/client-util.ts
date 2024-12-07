import fs from 'fs-extra'
import { getLogger } from 'log4js'
import path from 'path'
import { replaceInFile } from 'replace-in-file'

import env from './env'

/**
 * A class for interacting with the browser client bundle.
 */
export default class ClientUtil {
  private static logger = getLogger('ClientUtil')

  /**
   * Gets the directory in which the browser client bundle resides. Throws an error if the directory does not exist on the filesystem.
   *
   * @returns The absolute directory of the browser client bundle.
   */
  static async getDirectory(): Promise<string> {
    let clientDir = env().CLIENT_DIR
    ClientUtil.logger.trace(`clientDir: "${clientDir}"`)

    if (!path.isAbsolute(clientDir)) {
      clientDir = path.join(__dirname, clientDir)
    }

    ClientUtil.logger.debug(`Client directory resolved to "${clientDir}"`)

    if (!(await fs.pathExists(clientDir))) {
      throw Error(
        `Invalid client directory "${clientDir}", path either does not exist (potentially needs to be built) or is not accessible due to permissions.`
      )
    }

    return clientDir
  }

  /**
   * Sets environment variables in the browser client bundle.
   *
   * @param clientDir The directory containing the browser client bundle.
   */
  static async setEnvVars(clientDir: string) {
    const envFile = path.join(clientDir, 'dynamic-env.js')
    ClientUtil.logger.trace(`envFile: "${envFile}"`)
    ClientUtil.logger.trace(`env.API_BASE_URL: "${env().API_BASE_URL}"`)
    ClientUtil.logger.trace(`env.WEB_SOCKET_PING_INTERVAL_SECONDS: "${env().WEB_SOCKET_PING_INTERVAL_SECONDS}"`)
    if (!(await fs.pathExists(envFile))) {
      throw Error(`Client env file "${envFile}" does not exist, ensure it has been built properly.`)
    }
    await replaceInFile({
      files: [envFile],
      disableGlobs: true,
      from: /API_BASE_URL:(\s*)(['"]).*?(['"])/,
      to: `API_BASE_URL:$1$2${env().API_BASE_URL}$3`,
    })
    await replaceInFile({
      files: [envFile],
      disableGlobs: true,
      from: /WEB_SOCKET_PING_INTERVAL_SECONDS:(\s*)(['"]).*?(['"])/,
      to: `WEB_SOCKET_PING_INTERVAL_SECONDS:$1$2${env().WEB_SOCKET_PING_INTERVAL_SECONDS}$3`,
    })
  }
}
