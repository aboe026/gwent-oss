import fs from 'fs-extra'
import { getLogger } from 'log4js'
import path from 'path'

import env from './env'

export default class AppInfo {
  private static logger = getLogger('AppInfo')

  /**
   * Gets the path of the file containing information about the application.
   *
   * @returns The path to the file containing information about the application.
   */
  private static getFile(): string {
    AppInfo.logger.trace(`APP_INFO_FILE_PATH: "${env().APP_INFO_FILE_PATH}"`)
    let filePath = env().APP_INFO_FILE_PATH
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(__dirname, filePath)
    }
    return filePath
  }

  /**
   * Gets the build number of the running application.
   *
   * @returns The build number which produced the version of the application running. Defaults to "0" if not found in the "APP_INFO_FILE_PATH" file.
   */
  static async getBuildNumber(): Promise<number> {
    const filePath = AppInfo.getFile()
    AppInfo.logger.debug(`filePath: "${filePath}"`)
    if (await fs.pathExists(filePath)) {
      try {
        const contents = await fs.readFile(filePath, 'utf-8')
        if (AppInfo.logger.isTraceEnabled()) {
          AppInfo.logger.trace(`contents: "${contents}"`)
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
                  AppInfo.logger.error(
                    `Invalid buildNumber "${json.buildNumber}" found in "APP_INFO_FILE_PATH" file "${filePath}", must be positive integer`
                  )
                }
              } else {
                AppInfo.logger.error(
                  `Invalid buildNumber "${json.buildNumber}" found in "APP_INFO_FILE_PATH" file "${filePath}", not an integer`
                )
              }
            } else {
              AppInfo.logger.error(
                `Invalid buildNumber "${json.buildNumber}" found in "APP_INFO_FILE_PATH" file "${filePath}", type "${type}" not of required type "number"`
              )
            }
          } else {
            AppInfo.logger.error(
              `Invalid JSON "${JSON.stringify(
                json
              )}" found in "APP_INFO_FILE_PATH" file "${filePath}", does not contain "buildNumber" property`
            )
          }
        } catch (err: unknown) {
          AppInfo.logger.error(
            `Could not parse "APP_INFO_FILE_PATH" file "${filePath}" contents "${contents}" as JSON:`,
            err
          )
        }
      } catch (err: unknown) {
        AppInfo.logger.error(`Could not read "APP_INFO_FILE_PATH" file "${filePath}":`, err)
      }
    } else {
      AppInfo.logger.error(`Invalid "APP_INFO_FILE_PATH" value of "${filePath}", does not exist or cannot access.`)
    }
    return 0
  }
}
