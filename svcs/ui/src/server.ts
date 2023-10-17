import express from 'express'
import fs from 'fs-extra'
import path from 'path'
import { replaceInFile } from 'replace-in-file'

import env from './env'

//
;(async () => {
  try {
    const clientDir = await getClientDir()

    await setClientEnv(clientDir)

    const app = express()

    app.use(express.static(clientDir))

    app.listen(env.PORT, () => {
      console.log(`Serving React app at "http://localhost:${env.PORT}"`)
    })
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()

async function getClientDir(): Promise<string> {
  let clientDir = env.CLIENT_DIR

  if (!path.isAbsolute(clientDir)) {
    clientDir = path.join(__dirname, clientDir)
  }

  console.log(`Client directory resolved to "${clientDir}"`)

  if (!(await fs.pathExists(clientDir))) {
    throw Error(
      `Invalid client directory "${clientDir}", path either does not exist (potentially needs to be built) or is not accessible due to permissions.`
    )
  }

  return clientDir
}

async function setClientEnv(clientDir: string) {
  const envFile = path.join(clientDir, 'dynamic-env.js')
  if (!(await fs.pathExists(envFile))) {
    throw Error(`Client env file "${envFile}" does not exist, ensure it has been built properly.`)
  }
  await replaceInFile({
    files: [envFile],
    from: /API_URL:(\s*)(['"]).*?(['"])/,
    to: `API_URL:$1$2${env.API_URL}$3`,
  })
}
