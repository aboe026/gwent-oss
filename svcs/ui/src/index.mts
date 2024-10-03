import env from './env.mjs' // import env first so any dependent packages/code get correct/resolved environment variables

import log4js from 'log4js'

import Server from './server.mjs'

log4js.configure({
  appenders: { out: { type: 'stdout' } },
  categories: { default: { appenders: ['out'], level: env().LOG_LEVEL } },
})
const logger = log4js.getLogger('index')

/**
 * The entrypoint of the UI Server.
 */
;(async () => {
  try {
    await Server.run()
  } catch (err) {
    logger.fatal(err)
    process.exitCode = 1
  }
})()
