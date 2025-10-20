import env from './env'
import { createClient } from '@gwent/graphql-schema/node-client'

//
;(async () => {
  const client = createClient({
    graphqlUrl: env.API_URL,
  })
  const user1 = await client.addUser({
    name: `rando-A-${Date.now()}`,
    password: 'password',
  })
  console.log(`user1: "${JSON.stringify(user1)}"`)
})().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
