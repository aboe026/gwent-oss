import fs from 'fs/promises'
import { getLogger } from 'log4js'
import path from 'path'

import fileExists from './file-exists'

/**
 * A class for getting information about the currently running instance of gwent-oss.
 */
export default class AppInfo {
  private static logger = getLogger('AppInfo')

  /**
   * Resolves path of the file containing information about the application.
   *
   * @param appInfoFilePath The path on the system to the file containing application information
   *
   * @returns The absolute path to the file containing information about the application.
   */
  private static resolvePath(appInfoFilePath: string): string {
    AppInfo.logger.trace(`appInfoFilePath: "${appInfoFilePath}"`)
    let filePath = appInfoFilePath
    if (!path.isAbsolute(filePath)) {
      const procDir = process.cwd()
      AppInfo.logger.debug(`Making appInfoFilePath absolute to: "${procDir}"`)
      filePath = path.join(procDir, filePath)
    }
    return filePath
  }

  /**
   * Gets the build number of the running application.
   *
   * @param appInfoFilePath The path on the system to the file containing application information
   *
   * @returns The build number which produced the version of the application running. Defaults to "0" if not found in the "APP_INFO_FILE_PATH" file.
   */
  static async getBuildNumber(appInfoFilePath: string): Promise<number> {
    const filePath = AppInfo.resolvePath(appInfoFilePath)
    AppInfo.logger.trace(`filePath: "${filePath}"`)
    if (await fileExists(filePath)) {
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
