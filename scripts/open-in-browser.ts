import fs from 'fs/promises'
import open from 'open'

//
;(async () => {
  const filePath = process.argv[2]
  if (!filePath) {
    throw Error('Must specify file path as first argument.')
  }
  try {
    await fs.access(filePath)
  } catch (error: unknown) {
    throw Error(`File "${filePath}" either does not exist or cannot access.`)
  }
  await open(process.argv[2], {
    wait: false,
  })
})().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
