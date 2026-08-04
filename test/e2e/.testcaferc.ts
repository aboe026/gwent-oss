import path from 'path'

import DbProfiler from '@gwent-oss/db-profiler'
import { E2eCtx, E2ETestController } from './src/util/e2e-ctx'
import env from './src/util/e2e-env'

const profiler = new DbProfiler({
  mongoUrl: env.MONGO_URL,
  mongoDb: env.MONGO_DB,
})

const config: any = {
  browsers: [env.BROWSER],
  concurrency: env.CONCURRENCY,
  hooks: {
    testRun: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      before: async (ctx: any) => {
        await profiler.start()
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      before: async (ctx: E2eCtx) => {
        ctx.start = new Date().getTime()
      },
    },
    test: {
      before: async (t: E2ETestController<E2eCtx, E2eCtx>) => {
        t.ctx.start = new Date().getTime()
        await t.resizeWindow(env.WINDOW_WIDTH, env.WINDOW_HEIGHT)
      },
    },
  },
  reporter: [
    {
      name: 'spec',
    },
    {
      name: 'xunit',
      output: 'results/e2e.xml',
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
  config.appCommand = 'yarn start-app'
  config.appInitDelay = 10000
}

module.exports = config
