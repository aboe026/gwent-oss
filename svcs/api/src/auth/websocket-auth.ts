import { getLogger } from 'log4js'
import { IncomingMessage } from 'http'
import MongoStore from 'connect-mongo'
import { SessionData } from 'express-session'
import { signedCookie } from 'cookie-parser'

import env from '../env'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'

export default class WebSocketAuth {
  private static logger = getLogger('WebSocketAuth')

  static async authenticate({
    req,
    mongoStore,
  }: {
    req: IncomingMessage
    mongoStore: MongoStore
  }): Promise<UserDbObject | undefined> {
    const origin = req.headers['origin']
    if (WebSocketAuth.logger.isTraceEnabled()) {
      WebSocketAuth.logger.trace(`origin: "${origin}"`)
    }
    // prevent XSS
    if (origin === env().CORS_ORIGIN) {
      const cookies = req.headers['cookie']
      WebSocketAuth.logger.trace(`cookies: "${cookies}"`)
      if (cookies) {
        const cookieMap = parseCookies(cookies)
        if (WebSocketAuth.logger.isTraceEnabled()) {
          WebSocketAuth.logger.trace(`cookieMap: "${JSON.stringify(cookieMap)}"`)
        }
        const encodedSessionId = cookieMap[env().SESSION_COOKIE_NAME]
        WebSocketAuth.logger.trace(`encodedSessionId: "${encodedSessionId}"`)
        if (encodedSessionId) {
          const sessionId = signedCookie(decodeURIComponent(encodedSessionId), env().SESSION_SECRET)
          WebSocketAuth.logger.trace(`sessionId: "${sessionId}"`)

          if (sessionId && sessionId !== encodedSessionId) {
            const session: SessionDataWithUser | null | undefined = await new Promise((resolve, reject) => {
              mongoStore.get(sessionId, (err, session) => {
                if (err) {
                  reject(err)
                } else {
                  resolve(session as SessionDataWithUser)
                }
              })
            })
            if (WebSocketAuth.logger.isTraceEnabled()) {
              WebSocketAuth.logger.trace(`session: "${JSON.stringify(session)}"`)
            }

            return session?.user
          } else {
            WebSocketAuth.logger.debug(
              'Rejecting connection due to decoded session id not being different than encoded session id.'
            )
          }
        } else {
          WebSocketAuth.logger.debug('Rejecting connection due to no sid cookie set')
        }
      } else {
        WebSocketAuth.logger.debug('Rejecting connection due to header "cookies" not existing on request.')
      }
    } else {
      WebSocketAuth.logger.debug(
        `Rejecting connection due to origin "${origin}" not matching CORS origin "${env().CORS_ORIGIN}"`
      )
    }

    return undefined
  }
}

export function parseCookies(cookies: string): CookieMap {
  const pairs = cookies.split(';')
  const map: CookieMap = {}
  for (const pair of pairs) {
    const [key, value] = pair.split('=')
    map[key.trim()] = value.trim()
  }
  return map
}

interface CookieMap {
  [x: string]: string
}

interface SessionDataWithUser extends SessionData {
  user: UserDbObject
}
