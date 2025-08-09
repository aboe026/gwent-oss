import express, { Express } from 'express'
import fs from 'fs-extra'
import { getLogger } from 'log4js'
import path from 'path'

import ClientUtil from './client-util'
import env from './env'

/**
 * A class to handle startup and configuration of the UI server.
 */
export default class Server {
  private static logger = getLogger('Server')
  private static clientDir: string
  private static app: Express

  /**
   * Bring up the UI server.
   */
  static async run() {
    await Server.configureClientDir()

    Server.app = express()

    await Server.configureImages()

    await Server.serve()
  }

  /**
   * Gets the client directory and sets environment variables for it.
   */
  private static async configureClientDir() {
    Server.clientDir = await ClientUtil.getDirectory()
    await ClientUtil.setEnvVars(Server.clientDir)
  }

  /**
   * Configures the server to serve the images directory as a static public route
   */
  private static async configureImages() {
    const imagesDir = env().IMAGES_DIR
    this.logger.trace(`imagesDir: "${imagesDir}"`)
    const imagesPath = path.isAbsolute(imagesDir) ? imagesDir : path.join(__dirname, imagesDir)
    this.logger.trace(`imagesPath: "${imagesPath}"`)
    if (!(await fs.exists(imagesPath))) {
      throw Error(`IMAGES_DIR "${imagesPath}" does not exist.`)
    }
    Server.app.use('/images', express.static(imagesPath))
  }

  /**
   * Set the api to listen for requests.
   */
  private static async serve() {
    Server.app.use(express.static(Server.clientDir))

    // necessary to get Route's working properly
    Server.app.get('*name', function (req, res) {
      res.sendFile(path.resolve(Server.clientDir, 'index.html'))
    })

    Server.logger.trace(`env.PORT: "${env().PORT}"`)
    await new Promise<void>((resolve) => Server.app.listen({ port: env().PORT }, resolve))
    Server.logger.info(`Serving React app at "http://localhost:${env().PORT}"`)
  }
}
