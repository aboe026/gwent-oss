import { createClient } from 'graphql-ws'
import crypto from 'crypto'
import { serialize } from 'cookie'
import urlJoin from 'url-join'
import WebSocket from 'ws'

import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import env from '../util/env'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Subscription')

test('Connection rejected if invalid session id on cookie', async (t) => {
  await t
    .expect(
      await testSubscriptionError({
        sessionId: 'invalid-session-id',
        timeoutSeconds: 5,
      })
    )
    .eql(4403)
})

async function testSubscriptionError({
  timeoutSeconds,
  sessionId,
}: {
  sessionId: string
  timeoutSeconds: number
}): Promise<any> {
  // custom class allows setting headers on connections
  class E2eWebSocket extends WebSocket {
    constructor(address: any, protocols: any) {
      super(address, protocols, {
        headers: {
          origin: env.BASE_URL,
          cookie: createCookie({
            name: env.SESSION_COOKIE_NAME,
            value: sessionId,
            secret: env.SESSION_SECRET,
          }),
        },
      })
    }
  }

  return new Promise(async (resolve) => {
    // ensure promise is resolved if connection not rejected
    setTimeout(() => resolve(`Subscription not rejected within ${timeoutSeconds} seconds`), timeoutSeconds * 1000)
    try {
      const client = createClient({
        url: urlJoin(env.API_BASE_URL.replace(/https:\/\//, 'wss://').replace(/http:\/\//, 'ws://'), 'subscribe'),
        webSocketImpl: E2eWebSocket,
        retryAttempts: 0,
      })

      const subscription = client.iterate({
        operationName: 'DeckAdded',
        query: `subscription DeckAdded {
          deckAdded {
            id
          }
        }`,
      })

      for await (const event of subscription) {
        resolve(event)
        break // complete a running subscription by breaking the iterator loop
      }
    } catch (err: unknown) {
      resolve((err as any).code)
    }
  })
}

function createCookie({ name, secret, value }: { name: string; value: string; secret: string }) {
  const signed = `s:${sign(value, secret)}`
  return serialize(name, signed)
}

function sign(value: string, secret: string): string {
  return `${value}.${crypto.createHmac('sha256', secret).update(value).digest('base64').replace(/\\=+$/, '')}`
}
