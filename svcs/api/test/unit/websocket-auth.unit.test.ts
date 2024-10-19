import cookieParser from 'cookie-parser'
import { IncomingMessage } from 'http'
import { Logger } from 'log4js'
import MongoStore from 'connect-mongo'

import * as env from '../../src/env'
import TestUtil from '../test-util'
import WebSocketAuth, { parseCookies, SessionDataWithUser } from '../../src/auth/websocket-auth'

describe('websocket-auth', () => {
  describe('authenticate', () => {
    it('returns undefined if origin does not match CORS_ORIGIN', async () => {
      const corsOrigin = 'hostname'
      const headerOrigin = 'localhost'
      await testAuthenticate({
        corsOrigin,
        req: {
          headers: {
            origin: headerOrigin,
          },
        } as unknown as IncomingMessage,
        errorCalls: [
          [`Rejecting connection due to origin "${headerOrigin}" not matching CORS origin "${corsOrigin}".`],
        ],
      })
    })
    it('returns undefined if no cookies on request', async () => {
      const corsOrigin = 'hostname'
      await testAuthenticate({
        corsOrigin,
        req: {
          headers: {
            origin: corsOrigin,
          },
        } as unknown as IncomingMessage,
        errorCalls: [['Rejecting connection due to header "cookie" not existing on request.']],
      })
    })
    it('returns undefined if session cookie not provided', async () => {
      const corsOrigin = 'hostname'
      await testAuthenticate({
        corsOrigin,
        req: {
          headers: {
            origin: corsOrigin,
            cookie: 'foo=bar;',
          },
        } as unknown as IncomingMessage,
        errorCalls: [['Rejecting connection due to no session ID cookie set.']],
      })
    })
    it('returns undefined if encoded session cookie decodes to be false', async () => {
      const corsOrigin = 'hostname'
      const sessionCookieName = 'gwent.sid'
      await testAuthenticate({
        corsOrigin,
        sessionCookieName,
        req: {
          headers: {
            origin: corsOrigin,
            cookie: `${sessionCookieName}=123;`,
          },
        } as unknown as IncomingMessage,
        signedCookieResponse: false,
        errorCalls: [['Rejecting connection due to session id not decoding correctly.']],
      })
    })
    it('returns undefined if encoded session cookie decodes to be the encoded value', async () => {
      const corsOrigin = 'hostname'
      const sessionCookieName = 'gwent.sid'
      await testAuthenticate({
        corsOrigin,
        sessionCookieName,
        req: {
          headers: {
            origin: corsOrigin,
            cookie: `${sessionCookieName}=123;`,
          },
        } as unknown as IncomingMessage,
        signedCookieResponse: '123',
        errorCalls: [['Rejecting connection due to session id not decoding correctly.']],
      })
    })
    it('returns undefined if mongo store throws error', async () => {
      const corsOrigin = 'hostname'
      const sessionCookieName = 'gwent.sid'
      const sessionId = '123'
      const error = 'Session not found'
      await testAuthenticate({
        corsOrigin,
        sessionCookieName,
        req: {
          headers: {
            origin: corsOrigin,
            cookie: `${sessionCookieName}=456;`,
          },
        } as unknown as IncomingMessage,
        signedCookieResponse: sessionId,
        session: Error(error),
        errorCalls: [[`Could not get user with session ID "${sessionId}": "${Error(error)}"`]],
      })
    })
    it('returns undefined if session undefined', async () => {
      const corsOrigin = 'hostname'
      const sessionCookieName = 'gwent.sid'
      const sessionId = '123'
      await testAuthenticate({
        corsOrigin,
        sessionCookieName,
        req: {
          headers: {
            origin: corsOrigin,
            cookie: `${sessionCookieName}=456;`,
          },
        } as unknown as IncomingMessage,
        signedCookieResponse: sessionId,
        session: undefined as unknown as SessionDataWithUser,
        errorCalls: [[`Rejecting connection because no user on session "${sessionId}"`]],
      })
    })
    it('returns undefined if no user on session', async () => {
      const corsOrigin = 'hostname'
      const sessionCookieName = 'gwent.sid'
      const sessionId = '123'
      await testAuthenticate({
        corsOrigin,
        sessionCookieName,
        req: {
          headers: {
            origin: corsOrigin,
            cookie: `${sessionCookieName}=456;`,
          },
        } as unknown as IncomingMessage,
        signedCookieResponse: sessionId,
        session: {} as unknown as SessionDataWithUser,
        errorCalls: [[`Rejecting connection because no user on session "${sessionId}"`]],
      })
    })
    it('returns user if returned on session', async () => {
      const corsOrigin = 'hostname'
      const sessionCookieName = 'gwent.sid'
      const sessionId = '123'
      await testAuthenticate({
        corsOrigin,
        sessionCookieName,
        req: {
          headers: {
            origin: corsOrigin,
            cookie: `${sessionCookieName}=456;`,
          },
        } as unknown as IncomingMessage,
        signedCookieResponse: sessionId,
        session: {
          user: TestUtil.getDbUser({}),
        } as unknown as SessionDataWithUser,
      })
    })
    it('calls to trace if enabled', async () => {
      const corsOrigin = 'hostname'
      const sessionCookieName = 'gwent.sid'
      const encodedSessionId = '456'
      const sessionId = '123'
      await testAuthenticate({
        corsOrigin,
        sessionCookieName,
        req: {
          headers: {
            origin: corsOrigin,
            cookie: `${sessionCookieName}=${encodedSessionId};`,
          },
        } as unknown as IncomingMessage,
        encodedSessionId,
        signedCookieResponse: sessionId,
        session: {
          user: TestUtil.getDbUser({}),
        } as unknown as SessionDataWithUser,
        traceEnabled: true,
      })
    })
  })
  describe('parseCookies', () => {
    it('returns empty object if empty string', () => {
      expect(parseCookies('')).toEqual({})
    })
    it('returns empty object if no semicolon', () => {
      expect(parseCookies('foo')).toEqual({})
    })
    it('returns empty object if no equal sign', () => {
      expect(parseCookies('foo;')).toEqual({})
    })
    it('returns empty object if no key', () => {
      expect(parseCookies('=foo;')).toEqual({})
    })
    it('returns object with single property if single cookie supplied without value', () => {
      expect(parseCookies('foo=')).toEqual({
        foo: '',
      })
    })
    it('returns object with single property if single cookie supplied with value', () => {
      expect(parseCookies('foo=bar')).toEqual({
        foo: 'bar',
      })
    })
    it('returns object with single property if multiple cookies with same key using last value', () => {
      expect(parseCookies('foo=bar;foo=world')).toEqual({
        foo: 'world',
      })
    })
    it('returns object with multiple properties if multiple cookies supplied without values', () => {
      expect(parseCookies('foo=;hello=')).toEqual({
        foo: '',
        hello: '',
      })
    })
    it('returns object with multiple properties if multiple cookies with values', () => {
      expect(parseCookies('foo=bar;hello=world')).toEqual({
        foo: 'bar',
        hello: 'world',
      })
    })
  })
})

async function testAuthenticate({
  req,
  corsOrigin,
  sessionCookieName,
  signedCookieResponse,
  session,
  encodedSessionId,
  errorCalls = [],
  traceEnabled,
}: {
  req: IncomingMessage
  corsOrigin: string
  sessionCookieName?: string
  signedCookieResponse?: string | false
  encodedSessionId?: string
  session?: SessionDataWithUser | Error
  errorCalls?: string[][]
  traceEnabled?: boolean
}) {
  const envSpy = jest.spyOn(env, 'default').mockReturnValue({
    CORS_ORIGIN: corsOrigin,
    SESSION_COOKIE_NAME: sessionCookieName,
  } as any)
  const signedCookieSpy = jest.spyOn(cookieParser, 'signedCookie')
  if (signedCookieResponse !== undefined) {
    signedCookieSpy.mockReturnValue(signedCookieResponse)
  }
  const mongoStoreGetSpy = jest.fn().mockImplementation((sessionId, callback) => {
    if (session instanceof Error) {
      callback(session, undefined)
    } else {
      callback(undefined, session)
    }
  })
  const mongoStore = {
    get: mongoStoreGetSpy,
  } as unknown as MongoStore
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  WebSocketAuth['logger'] = {
    error: errorSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as unknown as Logger

  await expect(
    WebSocketAuth.authenticate({
      req,
      mongoStore,
    })
  ).resolves.toEqual(session instanceof Error ? undefined : session?.user)

  expect(envSpy.mock.calls).toEqual([[], [], []])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`origin: "${req.headers.origin}"`],
          [`cookies: "${req.headers.cookie}"`],
          [`cookieMap: "${JSON.stringify({ [sessionCookieName || '']: encodedSessionId })}"`],
          [`encodedSessionId: "${encodedSessionId}"`],
          [`sessionId: "${signedCookieResponse}"`],
          [`session: "${JSON.stringify(session)}"`],
        ]
      : []
  )
}
