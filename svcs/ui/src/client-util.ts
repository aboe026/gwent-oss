import fs from 'fs-extra'
import { getLogger } from 'log4js'
import path from 'path'
import { replaceInFile } from 'replace-in-file'

import env from './env'

export default class ClientUtil {
  private static logger = getLogger('client-util')

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

  static async setEnvVars(clientDir: string) {
    const envFile = path.join(clientDir, 'dynamic-env.js')
    ClientUtil.logger.trace(`envFile: "${envFile}"`)
    ClientUtil.logger.trace(`env.API_URL: "${env().API_URL}"`)
    if (!(await fs.pathExists(envFile))) {
      throw Error(`Client env file "${envFile}" does not exist, ensure it has been built properly.`)
    }
    await replaceInFile({
      files: [envFile],
      from: /API_URL:(\s*)(['"]).*?(['"])/,
      to: `API_URL:$1$2${env().API_URL}$3`,
    })
  }
}
