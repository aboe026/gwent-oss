import eol from 'eol'
import fs from 'fs-extra'
import path from 'path'

/**
 * Ensures file endings match default for Operating System
 * (i.e. CRLF for Windows, LF for Mac/Linux)
 *
 * Files should be passed as arguments
 * (e.g. yarn convert-eol ./file-to-convert.txt ./second-file-to-convert.txt)
 */
;(async () => {
  for (let i = 2; i < process.argv.length; i++) {
    const filePath = path.join(__dirname, '..', process.argv[i])
    const text = await fs.readFile(filePath, {
      encoding: 'utf-8',
    })
    await fs.writeFile(filePath, eol.auto(text))
  }
})().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
