import fs from 'fs-extra'
import { getLogger } from 'log4js'
import path from 'path'

import env from './env'

const logger = getLogger('app-info')

export default class AppInfo {
  private static getFile(): string {
    logger.trace(`APP_INFO_FILE_PATH: "${env.APP_INFO_FILE_PATH}"`)
    let filePath = env.APP_INFO_FILE_PATH
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(__dirname, filePath)
    }
    return filePath
  }

  static async getBuildNumber(): Promise<number> {
    const filePath = AppInfo.getFile()
    logger.debug(`filePath: "${filePath}"`)
    if (await fs.pathExists(filePath)) {
      try {
        const contents = await fs.readFile(filePath)
        if (logger.isTraceEnabled()) {
          logger.trace(`contents: "${JSON.stringify(contents)}"`)
        }
        try {
          const json = JSON.parse(contents.toString())
          if ('buildNumber' in json) {
            const type = typeof json.buildNumber
            if (type === 'number') {
              if (Number.isInteger(json.buildNumber)) {
                const number = parseInt(json.buildNumber)
                if (number >= 0) {
                  return number
                } else {
                  logger.error(
                    `Invalid buildNumber "${json.buildNumber}" found in "APP_INFO_FILE_PATH" file "${filePath}", must be positive integer`
                  )
                }
              } else {
                logger.error(
                  `Invalid buildNumber "${json.buildNumber}" found in "APP_INFO_FILE_PATH" file "${filePath}", not an integer`
                )
              }
            } else {
              logger.error(
                `Invalid buildNumber "${json.buildNumber}" found in "APP_INFO_FILE_PATH" file "${filePath}", type "${type}" not of required type "number"`
              )
            }
          } else {
            logger.error(
              `Invalid JSON "${JSON.stringify(
                json
              )}" found in "APP_INFO_FILE_PATH" file "${filePath}", does not contain "buildNumber" property`
            )
          }
        } catch (err: unknown) {
          logger.error(`Could not parse "APP_INFO_FILE_PATH" file "${filePath}" contents "${contents}" as JSON:`, err)
        }
      } catch (err: unknown) {
        logger.error(`Could not read "APP_INFO_FILE_PATH" file "${filePath}":`, err)
      }
    } else {
      logger.error(`Invalid "APP_INFO_FILE_PATH" value of "${filePath}", does not exist or cannot access.`)
    }
    return 0
  }
}
