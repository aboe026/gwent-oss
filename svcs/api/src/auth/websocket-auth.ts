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
    const corsOrigin = env().CORS_ORIGIN
    const sessionCookieName = env().SESSION_COOKIE_NAME
    const sessionSecret = env().SESSION_SECRET

    const origin = req.headers['origin']
    if (WebSocketAuth.logger.isTraceEnabled()) {
      WebSocketAuth.logger.trace(`origin: "${origin}"`)
    }
    // prevent XSS
    if (origin === corsOrigin) {
      const cookies = req.headers['cookie']
      if (WebSocketAuth.logger.isTraceEnabled()) {
        WebSocketAuth.logger.trace(`cookies: "${cookies}"`)
      }
      if (cookies) {
        const cookieMap = parseCookies(cookies)
        if (WebSocketAuth.logger.isTraceEnabled()) {
          WebSocketAuth.logger.trace(`cookieMap: "${JSON.stringify(cookieMap)}"`)
        }
        const encodedSessionId = cookieMap[sessionCookieName]
        if (WebSocketAuth.logger.isTraceEnabled()) {
          WebSocketAuth.logger.trace(`encodedSessionId: "${encodedSessionId}"`)
        }
        if (encodedSessionId) {
          const sessionId = signedCookie(decodeURIComponent(encodedSessionId), sessionSecret)
          if (WebSocketAuth.logger.isTraceEnabled()) {
            WebSocketAuth.logger.trace(`sessionId: "${sessionId}"`)
          }

          if (sessionId && sessionId !== encodedSessionId) {
            let session: SessionDataWithUser | null | undefined = undefined
            try {
              session = await new Promise((resolve, reject) => {
                mongoStore.get(sessionId, (err, session) => {
                  if (err) {
                    reject(err)
                  } else {
                    resolve(session as SessionDataWithUser)
                  }
                })
              })
            } catch (err) {
              WebSocketAuth.logger.error(`Could not get user with session ID "${sessionId}": "${err}"`)
              return undefined
            }
            if (WebSocketAuth.logger.isTraceEnabled()) {
              WebSocketAuth.logger.trace(`session: "${JSON.stringify(session)}"`)
            }
            if (session?.user) {
              return session.user
            } else {
              WebSocketAuth.logger.error(`Rejecting connection because no user on session "${sessionId}"`)
            }
          } else {
            WebSocketAuth.logger.error('Rejecting connection due to session id not decoding correctly.')
          }
        } else {
          WebSocketAuth.logger.error('Rejecting connection due to no session ID cookie set.')
        }
      } else {
        WebSocketAuth.logger.error('Rejecting connection due to header "cookie" not existing on request.')
      }
    } else {
      WebSocketAuth.logger.error(
        `Rejecting connection due to origin "${origin}" not matching CORS origin "${corsOrigin}".`
      )
    }

    return undefined
  }
}

export function parseCookies(cookies: string): CookieMap {
  const map: CookieMap = {}
  const pairs = cookies.split(';')
  for (const pair of pairs) {
    if (pair) {
      const [key, value] = pair.split('=')
      if (key && value !== undefined) {
        map[key.trim()] = value.trim()
      }
    }
  }
  return map
}

export interface CookieMap {
  [x: string]: string
}

export interface SessionDataWithUser extends SessionData {
  user: UserDbObject
}
