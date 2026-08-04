import fs from 'fs/promises'
import path from 'path'

import { sleep } from '@gwent-oss/utils'

//
;(async () => {
  try {
    const timeoutSeconds = 30
    let builtExists = false
    const start = Date.now()
    while (!builtExists && (Date.now() - start) / 1000 < timeoutSeconds) {
      await sleep(1)
      try {
        await fs.access(path.join(__dirname, '..', 'build', '.testcaferc.js'))
        builtExists = true
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err: unknown) {
        // swallow error
      }
    }
    if (!builtExists) {
      throw Error(`Files successfully compiled after "${timeoutSeconds}" seconds`)
    }
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
})()
