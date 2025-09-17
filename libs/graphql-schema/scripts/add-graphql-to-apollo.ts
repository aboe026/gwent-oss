import fs from 'fs/promises'
import path from 'path'

/**
 * Adds an additional export to the index file for apollo typings
 * So frontend code has access to Documents and gql/fragment-masking in single import
 */
;(async () => {
  const indexFilePath = path.join(__dirname, '..', 'generated', 'apollo', 'index.ts')
  await ensureLineInFile({
    filePath: indexFilePath,
    line: 'export * from "./graphql";',
  })
})().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

async function ensureLineInFile({ filePath, line }: { filePath: string; line: string }) {
  const contents = await fs.readFile(filePath, {
    encoding: 'utf-8',
  })
  if (!contents.includes(line)) {
    await fs.appendFile(filePath, `\n${line}`, {})
  }
}
