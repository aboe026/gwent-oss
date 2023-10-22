import express from 'express'
import log4js from 'log4js'

import env from './env'
import ClientUtil from './client-util'

log4js.configure({
  appenders: { out: { type: 'stdout' } },
  categories: { default: { appenders: ['out'], level: env().LOG_LEVEL } },
})
const logger = log4js.getLogger('server')

//
;(async () => {
  try {
    const clientDir = await ClientUtil.getDirectory()

    await ClientUtil.setEnvVars(clientDir)

    const app = express()

    app.use(express.static(clientDir))

    logger.trace(`env.PORT: "${env().PORT}"`)
    app.listen(env().PORT, () => {
      logger.info(`Serving React app at "http://localhost:${env().PORT}"`)
    })
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
})()
