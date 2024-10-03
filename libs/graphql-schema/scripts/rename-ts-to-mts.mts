import fs from 'fs-extra'
import path from 'path'

/**
 * Renames files with .ts extension to have .mts extension
 *
 * Files should be passed as arguments
 * (e.g. yarn rename-ts-to-mts ./file-to-rename.ts ./second-file-to-rename.ts)
 */
;(async () => {
  for (let i = 2; i < process.argv.length; i++) {
    const filePath = path.join(import.meta.dirname, '..', process.argv[i])
    if (filePath.endsWith('.ts')) {
      const index = filePath.lastIndexOf('.ts')
      const newFilePath = `${filePath.substring(0, index)}.mts`
      await fs.move(filePath, newFilePath, {
        overwrite: true,
      })
    }
  }
})().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
