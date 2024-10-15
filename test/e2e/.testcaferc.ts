import path from 'path'

import DbProfiler from '@gwent/db-profiler'
import env from './src/util/env'

const profiler = new DbProfiler({
  mongoUrl: env.MONGO_URL,
  mongoDb: env.MONGO_DB,
})

const config: any = {
  browsers: [env.BROWSER],
  concurrency: env.CONCURRENCY,
  hooks: {
    testRun: {
      before: async (ctx: any) => {
        await profiler.start()
      },
      after: async (ctx: any) => {
        const profilerFile = path.join(__dirname, '..', 'perf', 'profiling.json')
        await profiler.stop()
        await profiler.recordToFile(profilerFile)
        const violations = await profiler.getViolations(profilerFile)
        if (violations.length > 0) {
          throw Error(`Violations when analyzing DB: "${JSON.stringify(violations)}"`)
        }
      },
    },
    fixture: {
      before: async (ctx: any) => {
        ctx.start = new Date().getTime()
      },
    },
    test: {
      before: async (t: any) => {
        t.ctx.start = new Date().getTime()
      },
    },
  },
  reporter: [
    {
      name: 'spec',
    },
    {
      name: 'xunit',
      output: 'test-results/e2e.xml',
    },
  ],
  screenshots: {
    path: 'screenshots',
    takeOnFails: true,
  },
  skipJsErrors: true,
  src: 'build/src/tests',
}

if (process.env.START_APP === 'true') {
  config.appCommand = 'yarn start-gwent'
  config.appInitDelay = 10000
}

module.exports = config
