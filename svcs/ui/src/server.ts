import express, { Express } from 'express'
import log4js from 'log4js'
import path from 'path'

import env from './env'
import ClientUtil from './client-util'

/**
 * A class to handle startup and configuration of the UI server
 */
export default class Server {
  private static logger = log4js.getLogger('server')
  private static clientDir: string
  private static app: Express

  /**
   * Bring up the UI server
   */
  static async run() {
    await Server.configureClientDir()

    Server.app = express()

    await Server.serve()
  }

  /**
   * Gets the client directory and sets environment variables for it
   */
  private static async configureClientDir() {
    Server.clientDir = await ClientUtil.getDirectory()
    await ClientUtil.setEnvVars(Server.clientDir)
  }

  /**
   * Set the api to listen for requests
   */
  private static async serve() {
    Server.app.use(express.static(Server.clientDir))

    // necessary to get Route's working properly
    Server.app.get('*', function (req, res) {
      res.sendFile(path.resolve(Server.clientDir, 'index.html'))
    })

    Server.logger.trace(`env.PORT: "${env().PORT}"`)
    await new Promise<void>((resolve) => Server.app.listen({ port: env().PORT }, resolve))
    Server.logger.info(`Serving React app at "http://localhost:${env().PORT}"`)
  }
}
