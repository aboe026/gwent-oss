import env from './env' // import env first so any dependent packages/code get correct/resolved environment variables

import log4js from 'log4js'

import Api from './api'

log4js.configure({
  appenders: { out: { type: 'stdout' } },
  categories: { default: { appenders: ['out'], level: env().LOG_LEVEL } },
})
const logger = log4js.getLogger('index')

/**
 * The entrypoint of the API Server.
 */
;(async () => {
  try {
    await Api.run()
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
})()
