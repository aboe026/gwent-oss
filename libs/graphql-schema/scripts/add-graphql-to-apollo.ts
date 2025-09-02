import fs from 'fs/promises'
import path from 'path'

/**
 * Adds an additional export to the index file for apollo typings
 * So frontend code has access to Documents and gql/fragment-masking in single import
 */
;(async () => {
  const indexFilePath = path.join(__dirname, '..', 'generated', 'apollo', 'index.ts')
  const contents = await fs.readFile(indexFilePath, {
    encoding: 'utf-8',
  })
  const exportCode = 'export * from "./graphql";'
  if (!contents.includes(exportCode)) {
    await fs.appendFile(indexFilePath, `\n${exportCode}`, {})
  }
})().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
