import express, { Express } from 'express'
import { getLogger } from 'log4js'
import path from 'path'

import { AppInfo, fileExists } from '@gwent-oss/node-utils'
import ClientUtil from './client-util'
import env from './env'
import { startupText } from '@gwent-oss/utils'
import { version } from '../package.json'

/**
 * A class to handle startup and configuration of the UI server.
 */
export default class Ui {
  private static logger = getLogger('Ui')
  private static clientDir: string
  private static app: Express

  /**
   * Bring up the UI server.
   */
  static async run() {
    await this.printStartupInfo()
    await Ui.configureClientDir()

    Ui.app = express()

    await Ui.configureImages()
    await Ui.serve()
  }

  /**
   * print relevant startup information.
   */
  private static async printStartupInfo() {
    Ui.logger.info(startupText)
    Ui.logger.info(`Version: "${version}"`)
    Ui.logger.debug(`Build: "${await AppInfo.getBuildNumber(env().APP_INFO_FILE_PATH)}"`)
    Ui.logger.trace(`NODE_ENV: "${env().NODE_ENV}"`)
    Ui.logger.info(`LOG_LEVEL: "${env().LOG_LEVEL}"`)
  }

  /**
   * Gets the client directory and sets environment variables for it.
   */
  private static async configureClientDir() {
    Ui.clientDir = await ClientUtil.getDirectory()
    await ClientUtil.setEnvVars(Ui.clientDir)
  }

  /**
   * Configures the server to serve the images directory in a static public route
   */
  private static async configureImages() {
    const imagesDir = env().IMAGES_DIR
    this.logger.trace(`imagesDir: "${imagesDir}"`)
    const imagesPath = path.isAbsolute(imagesDir) ? imagesDir : path.join(__dirname, imagesDir)
    this.logger.trace(`imagesPath: "${imagesPath}"`)
    if (!(await fileExists(imagesPath))) {
      throw Error(`IMAGES_DIR "${imagesPath}" does not exist.`)
    }
    Ui.app.use('/images', express.static(imagesPath))
  }

  /**
   * Set the api to listen for requests.
   */
  private static async serve() {
    Ui.app.use(express.static(Ui.clientDir))

    // necessary to get Route's working properly
    Ui.app.get('*name', function (req, res) {
      res.sendFile(path.resolve(Ui.clientDir, 'index.html'))
    })

    Ui.logger.trace(`env.PORT: "${env().PORT}"`)
    await new Promise<void>((resolve) => Ui.app.listen({ port: env().PORT }, resolve))
    Ui.logger.info(`Serving React app at "http://localhost:${env().PORT}"`)
  }
}
