import fs from 'fs-extra'
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
      builtExists = await fs.exists(path.join(__dirname, '..', 'build', 'src', 'index.js'))
    }
    if (!builtExists) {
      throw Error(`App not successfully built after "${timeoutSeconds}" seconds`)
    }
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
})()
