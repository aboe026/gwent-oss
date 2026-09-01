import { getLogger } from 'log4js'
import { IncomingMessage } from 'http'
import MongoStore from 'connect-mongo'
import { parse } from 'cookie'
import { SessionData } from 'express-session'
import { signedCookie } from 'cookie-parser'

import CorsUtil from '../util/cors-util'
import env from '../env'
import SessionUtil from '../util/session-util'
import { UserDbObject } from '@gwent-oss/graphql-schema/database-typings'

/**
 * A class for handling authentication for WebSockets.
 */
export default class WebSocketAuth {
  private static logger = getLogger('WebSocketAuth')

  /**
   * Attempt to authenticate a WebSocket.
   * Relies on a valid session cookie being passed as a header.
   *
   * @param config The configuration to authenticate.
   * @param config.req The incoming Request to authenticate.
   * @param config.mongoStore The MongoStore to use for looking up sessions in the database.
   * @returns The User database object if authentication is valid, undefined otherwise.
   */
  static async authenticate({
    req,
    mongoStore,
  }: {
    req: IncomingMessage
    mongoStore: MongoStore
  }): Promise<UserDbObject | undefined> {
    const corsOrigin = CorsUtil.resolveCorsOrigin(env().CORS_ORIGIN)
    const sessionCookieName = env().SESSION_COOKIE_NAME
    const sessionSecret = await SessionUtil.getSessionSecret()
    console.log(`TEST sessionSecret: "${sessionSecret}"`)

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
        const cookieMap = parse(cookies)
        if (WebSocketAuth.logger.isTraceEnabled()) {
          WebSocketAuth.logger.trace(`cookieMap: "${JSON.stringify(cookieMap)}"`)
        }
        const encodedSessionId = cookieMap[sessionCookieName]
        if (WebSocketAuth.logger.isTraceEnabled()) {
          WebSocketAuth.logger.trace(`encodedSessionId: "${encodedSessionId}"`)
        }
        if (encodedSessionId) {
          console.log(`TEST encodedSessionId: "${encodedSessionId}"`)
          const sessionId = signedCookie(encodedSessionId, sessionSecret)
          console.log(`TEST sessionId: "${sessionId}"`)
          if (WebSocketAuth.logger.isTraceEnabled()) {
            WebSocketAuth.logger.trace(`sessionId: "${sessionId}"`)
          }

          if (sessionId && sessionId !== encodedSessionId) {
            let session: SessionDataWithUser | null | undefined
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

export interface SessionDataWithUser extends SessionData {
  user: UserDbObject
}
