import fs from 'fs-extra'

import DbProfiler from '../src/index.mjs'

//
;(async () => {
  const file = process.argv[2]
  console.log(`Analyzing profiling file "${file}"`)
  if (!(await fs.pathExists(file))) {
    throw Error(`File "${file}" does not exist or is not accessible.`)
  }

  const profiler = new DbProfiler({
    mongoDb: '',
    mongoUrl: '',
  })
  const violations = await profiler.getViolations(file)
  if (violations.length > 0) {
    console.error('DB violations found:')
    console.error(violations)
  } else {
    console.log('No db violations found!')
  }
})().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
