import fs from 'fs-extra'
import path from 'path'

import { sleep } from '@gwent/utils'

//
;(async () => {
  try {
    const timeoutSeconds = 30
    let builtExists = false
    const start = Date.now()
    while (!builtExists && (Date.now() - start) / 1000 < timeoutSeconds) {
      await sleep(1)
      builtExists = await fs.exists(path.join(import.meta.dirname, '..', 'build', 'src', 'index.mjs'))
    }
    if (!builtExists) {
      throw Error(`App not successfully built after "${timeoutSeconds}" seconds`)
    }
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
})()
