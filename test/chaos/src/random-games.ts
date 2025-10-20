import fs from 'fs/promises'

import { createClient } from '@gwent/graphql-schema/node-client'
import env from './env'

//
;(async () => {
  await fs.rm(env.LOG_FILE, {
    force: true,
  })
  const client = createClient({
    graphqlUrl: env.API_URL,
  })
  const self = await client.addUser({
    name: `rando-self-${Date.now()}`,
    password: 'password',
  })
  const opponent = await client.addUser({
    name: `rando-opponent-${Date.now()}`,
    password: 'password',
  })
  await log(`Self username: "${self.addUser.name}"`)
  await log(`Opponent username: "${opponent.addUser.name}"`)
})().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

async function log(text: string) {
  await fs.appendFile(env.LOG_FILE, `${text}\n`, {
    encoding: 'utf-8',
  })
}
