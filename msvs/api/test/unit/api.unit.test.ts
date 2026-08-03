import * as apolloErrors from '@apollo/server/errors'
import { ApolloServer } from '@apollo/server'
import bodyParser from 'body-parser'
import cors from 'cors'
import { Disposable } from 'graphql-ws'
import express from 'express'
import figlet from 'figlet'
import { GraphQLFormattedError } from 'graphql'
import http from 'http'
import MongoStore from 'connect-mongo'
import session, { CookieOptions } from 'express-session'
import * as useWs from 'graphql-ws/use/ws'
import ws from 'ws'

import allUpgrades from '../../src/database/upgrades/all-upgrades'
import Api from '../../src/api'
import AppInfo from '../../src/app-info'
import BasicAuth from '../../src/auth/basic-auth'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import * as env from '../../src/env'
import { NODE_ENV } from '@gwent-oss/env'
import PresentableError from '../../src/util/presentable-error'
import schema from '../../src/graphql/executable-schema'
import TestUtil from '../util/test-util'
import { UserDbObject } from '@gwent-oss/graphql-schema/database-typings'
import { version } from '../../package.json'
import WebSocketAuth from '../../src/auth/websocket-auth'

jest.mock('express', () => {
  return jest.fn().mockImplementation(() => {
    return undefined
  })
})
jest.mock('cors', () => {
  return jest.fn().mockImplementation(() => {
    return undefined
  })
})
jest.mock('express-session', () => {
  return jest.fn().mockImplementation(() => {
    return undefined
  })
})
jest.mock('connect-mongo', () => {
  return {
    create: jest.fn().mockImplementation(),
  }
})
jest.mock('graphql/utilities', () => {
  return {
    printSchema: jest.fn().mockImplementation(),
  }
})
jest.mock('../../src/graphql/executable-schema', () => {
  return jest.fn().mockImplementation(() => {
    return undefined
  })
})
jest.mock('@apollo/server', () => {
  return {
    ApolloServer: jest.fn().mockImplementation(() => {
      return {
        start: jest.fn().mockResolvedValue(undefined),
        assertStarted: jest.fn().mockImplementation(),
      }
    }),
  }
})
jest.mock('@as-integrations/express5', () => {
  return {
    expressMiddleware: jest.fn().mockImplementation(),
  }
})

jest.mock('ws', () => {
  return {
    WebSocketServer: jest.fn().mockImplementation(() => {
      return {}
    }),
  }
})

jest.mock('graphql-ws/use/ws', () => {
  return {
    useServer: jest.fn().mockImplementation(() => {
      return {}
    }),
  }
})

describe('Api', () => {
  describe('run', () => {
    it('calls to appropriate methods', async () => {
      const printStartupInfoSpy = jest.spyOn(Api as any, 'printStartupInfo').mockImplementation()
      const dbUpgraderRunSpy = jest.spyOn(DbUpgrader.prototype, 'run').mockImplementation()
      const createServerSpy = jest.spyOn(http, 'createServer').mockImplementation()
      const configureSessionSpy = jest.spyOn(Api as any, 'configureSession').mockImplementation()
      const exposePlainSchemaSpy = jest.spyOn(Api as any, 'exposePlainSchema').mockImplementation()
      const subscriptionCleanup = {
        dispose: jest.fn().mockResolvedValue(''),
      } as unknown as Disposable
      const configureWebsocketServerSpy = jest
        .spyOn(Api as any, 'configureWebsocketServer')
        .mockReturnValue(subscriptionCleanup)
      const configureApolloServerSpy = jest.spyOn(Api as any, 'configureApolloServer').mockImplementation()
      const serveSpy = jest.spyOn(Api as any, 'serve').mockImplementation()

      await expect(Api.run()).resolves.toEqual(undefined)

      expect(printStartupInfoSpy.mock.calls).toEqual([[]])
      expect(dbUpgraderRunSpy.mock.calls).toEqual([
        [
          {
            upgrades: allUpgrades,
          },
        ],
      ])
      expect((express as any).mock.calls).toEqual([[]])
      expect(createServerSpy.mock.calls).toEqual([[undefined]])
      expect(configureSessionSpy.mock.calls).toEqual([[]])
      expect(exposePlainSchemaSpy.mock.calls).toEqual([[]])
      expect(configureWebsocketServerSpy.mock.calls).toEqual([[]])
      expect(configureApolloServerSpy.mock.calls).toEqual([[subscriptionCleanup]])
      expect(serveSpy.mock.calls).toEqual([[]])
    })
  })
  describe('printStartupInfo', () => {
    it('logs out correct information', async () => {
      const text = 'gwent-oss'
      const buildNumber = 0
      const nodeEnv = 'development'
      const logLevel = 'INFO'
      const textSyncSpy = jest.spyOn(figlet, 'textSync').mockReturnValue(text)
      const getBuildNumberSpy = jest.spyOn(AppInfo, 'getBuildNumber').mockResolvedValue(0)
      const envSpy = jest.spyOn(env, 'default').mockReturnValue({
        NODE_ENV: nodeEnv,
        LOG_LEVEL: logLevel,
      } as any)
      const infoSpy = jest.fn().mockImplementation()
      const debugSpy = jest.fn().mockImplementation()
      const traceSpy = jest.fn().mockImplementation()
      Api['logger'] = {
        info: infoSpy,
        debug: debugSpy,
        trace: traceSpy,
      } as any

      await expect(Api['printStartupInfo']()).resolves.toEqual(undefined)

      expect(textSyncSpy.mock.calls).toEqual([
        [
          'gwent-oss',
          {
            font: 'Tombstone',
          },
        ],
      ])
      expect(getBuildNumberSpy.mock.calls).toEqual([[]])
      expect(envSpy.mock.calls).toEqual([[], []])
      expect(infoSpy.mock.calls).toEqual([[`\n${text}`], [`Version: "${version}"`], [`LOG_LEVEL: "${logLevel}"`]])
      expect(debugSpy.mock.calls).toEqual([[`Build: "${buildNumber}"`]])
      expect(traceSpy.mock.calls).toEqual([[`NODE_ENV: "${nodeEnv}"`]])
    })
  })
  describe('configureSession', () => {
    it('calls to create session on app for development node env', () => {
      const sessionCookieName = 'gwent-oss.sid'
      testConfigureSession({
        nodeEnv: NODE_ENV.Dev,
        expectedCookie: {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 1000,
        },
        expectedProxy: false,
        traceCalls: [
          ['Session timeout: "1" second(s)'],
          ['session cookie proxy: "false"'],
          [`session cookie name: "${sessionCookieName}"`],
        ],
      })
    })
    it('calls to create session on app for production node env', () => {
      const sessionCookieName = 'gwent-oss.sid'
      testConfigureSession({
        nodeEnv: NODE_ENV.Prod,
        expectedCookie: {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 1000,
        },
        expectedProxy: true,
        sessionCookieName,
        setCalls: [['trust proxy', 1]],
        traceCalls: [
          ['Session timeout: "1" second(s)'],
          ['session cookie proxy: "true"'],
          ['enabling "trust proxy"'],
          [`session cookie name: "${sessionCookieName}"`],
        ],
      })
    })
    it('calls out to trace if enabled', () => {
      const cookie: CookieOptions = {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000,
      }
      const sessionCookieName = 'gwent-oss.sid'
      testConfigureSession({
        nodeEnv: NODE_ENV.Dev,
        expectedCookie: cookie,
        expectedProxy: false,
        traceEnabled: true,
        traceCalls: [
          ['Session timeout: "1" second(s)'],
          ['session cookie proxy: "false"'],
          [`cookie: "${JSON.stringify(cookie)}"`],
          [`session cookie name: "${sessionCookieName}"`],
        ],
      })
    })
  })
  describe('exposePlainSchema', () => {
    it('calls out to use endpoint and debugs location', () => {
      const setSpy = jest.fn().mockImplementation()
      const sendSpy = jest.fn().mockImplementation()
      const useSpy = jest.fn().mockImplementation((path, callback) => {
        callback(undefined, {
          set: setSpy,
          send: sendSpy,
        })
      })
      Api['app'] = {
        use: useSpy,
      } as any
      const debugSpy = jest.fn().mockImplementation()
      Api['logger'] = {
        debug: debugSpy,
      } as any
      const port = 4000
      const envSpy = jest.spyOn(env, 'default').mockReturnValue({
        PORT: port,
      } as any)

      expect(Api['exposePlainSchema']()).toEqual(undefined)

      expect(useSpy).toHaveBeenCalledTimes(1)
      expect(envSpy.mock.calls).toEqual([[]])
      expect(debugSpy.mock.calls).toEqual([[`GraphQL Schema is available at http://localhost:${port}/schema`]])
      expect(setSpy.mock.calls).toEqual([['Content-Type', 'text/plain']])
      expect(sendSpy.mock.calls).toEqual([[undefined]])
    })
  })
  describe('configureWebsocketServer', () => {
    it('creates instance of WebSocketServer and uses it', async () => {
      await testConfigureWebsocketServer({})
    })
    it('onConnect rejects user if authentication fails', async () => {
      await testConfigureWebsocketServer({
        testOnConnect: true,
      })
    })
    it('onConnect authenticates user and adds them to context if valid', async () => {
      await testConfigureWebsocketServer({
        authenticateResponse: TestUtil.getDbUser({}),
      })
    })
    it('calls out to trace on failed authentication if enabled without forwarded ip', async () => {
      await testConfigureWebsocketServer({
        testOnConnect: true,
        traceEnabled: true,
      })
    })
    it('calls out to trace on failed authentication if enabled with forwarded ip', async () => {
      await testConfigureWebsocketServer({
        testOnConnect: true,
        traceEnabled: true,
        requestForwarded: true,
      })
    })
    it('calls out to trace on successful authentication if enabled', async () => {
      await testConfigureWebsocketServer({
        authenticateResponse: TestUtil.getDbUser({}),
        testOnConnect: true,
        traceEnabled: true,
      })
    })
  })
  describe('configureApolloServer', () => {
    it('creates instance of ApolloServer and starts it', async () => {
      const debugSpy = jest.fn().mockImplementation()
      Api['logger'] = {
        debug: debugSpy,
      } as any
      const startSpy = jest.fn().mockImplementation()
      ApolloServer.prototype.start = startSpy
      Api['httpServer'] = {
        on: jest.fn().mockImplementation(),
      } as any
      Api['apolloServer'] = undefined as any
      const subscriptionCleanup = {
        dispose: jest.fn().mockResolvedValue(''),
      } as unknown as Disposable
      const ensureWebsocketDisposedSpy = jest.spyOn(Api as any, 'ensureWebsocketDisposed').mockImplementation()

      await expect(Api['configureApolloServer'](subscriptionCleanup)).resolves.toEqual(undefined)

      expect(Api['apolloServer']).not.toEqual(undefined)
      expect(ApolloServer).toHaveBeenCalledTimes(1)
      expect(ensureWebsocketDisposedSpy.mock.calls).toEqual([[subscriptionCleanup]])
      expect(startSpy.mock.calls).toEqual([[]])
      expect(debugSpy.mock.calls).toEqual([['starting ApolloServer'], ['ApolloServer started']])
    })
  })
  describe('maskError', () => {
    it('passes through error if PresentableError', () => {
      testMaskError({
        error: new PresentableError('presentable'),
      })
    })
    it('obscures error if not PresentableError', () => {
      testMaskError({
        error: new Error('not-presentable'),
      })
    })
  })
  describe('ensureWebsocketDisposed', () => {
    it('calls to dispose on subscription when server drained', async () => {
      const disposeSpy = jest.fn().mockResolvedValue('')
      const subscriptionCleanup = {
        dispose: disposeSpy,
      } as unknown as Disposable

      const response = Api['ensureWebsocketDisposed'](subscriptionCleanup)

      expect(response).toEqual({
        serverWillStart: expect.any(Function),
      })

      const startResponse = await response.serverWillStart()

      expect(startResponse).toEqual({
        drainServer: expect.any(Function),
      })

      await expect(startResponse.drainServer()).resolves.toEqual(undefined)

      expect(disposeSpy.mock.calls).toEqual([[]])
    })
  })
  describe('setContext', () => {
    it('calls to BasicAuth and returns session', async () => {
      const authenticateSpy = jest.spyOn(BasicAuth, 'authenticate').mockImplementation()
      const req = {
        session: 'test',
      } as any
      const res = {} as any

      await expect(
        Api['setContext']({
          req,
          res,
        })
      ).resolves.toEqual({
        session: req.session,
      })

      expect(authenticateSpy.mock.calls).toEqual([[req, res]])
    })
  })
  describe('serve', () => {
    it('calls to listen on the http server', async () => {
      const graphqlPath = 'graphql'
      const subscriptionPath = 'subscribe'
      const corsOrigin = 'localhost'
      const port = 4000
      const jsonUploadLimit = '1mb'
      const envSpy = jest.spyOn(env, 'default').mockReturnValue({
        GRAPHQL_PATH: graphqlPath,
        CORS_ORIGIN: corsOrigin,
        PORT: port,
        SUBSCRIPTION_PATH: subscriptionPath,
        JSON_UPLOAD_LIMIT: jsonUploadLimit,
      } as any)
      const useSpy = jest.fn().mockImplementation()
      Api['app'] = {
        use: useSpy,
      } as any
      const listenSpy = jest.fn().mockImplementation((config, callback) => {
        callback()
      })
      Api['httpServer'] = {
        listen: listenSpy,
      } as any
      Api['apolloServer'] = {
        foo: 'bar',
      } as any
      const infoSpy = jest.fn().mockImplementation()
      const debugSpy = jest.fn().mockImplementation()
      const traceSpy = jest.fn().mockImplementation()
      Api['logger'] = {
        debug: debugSpy,
        trace: traceSpy,
        info: infoSpy,
      } as any
      const jsonSpy = jest.spyOn(bodyParser, 'json').mockImplementation()

      await expect(Api['serve']()).resolves.toEqual(undefined)

      expect(useSpy).toHaveBeenCalledTimes(1)
      expect(envSpy.mock.calls).toEqual([[], [], [], [], [], [], [], [], [], [], [], []])
      expect(jsonSpy.mock.calls).toEqual([
        [
          {
            limit: jsonUploadLimit,
          },
        ],
      ])
      expect(listenSpy.mock.calls).toEqual([
        [
          {
            port,
          },
          expect.any(Function),
        ],
      ])
      expect((cors as any).mock.calls).toEqual([
        [
          {
            origin: [corsOrigin],
            credentials: true,
          },
        ],
      ])
      expect(infoSpy.mock.calls).toEqual([
        [`GraphQL Queries and Mutations listening at: "http://localhost:${port}/${graphqlPath}"`],
        [`GraphQL Subscription Websocket available at: "ws://localhost:${port}/${subscriptionPath}"`],
      ])
      expect(debugSpy.mock.calls).toEqual([[`CORS accepting requests from "${corsOrigin}"`]])
      expect(traceSpy.mock.calls).toEqual([
        [`GRAPHQL_PATH: "${graphqlPath}"`],
        [`CORS_ORIGIN: "${corsOrigin}"`],
        [`PORT: "${port}"`],
      ])
    })
  })
})

function testConfigureSession({
  nodeEnv,
  expectedCookie,
  expectedProxy,
  sessionCookieName = 'gwent-oss.sid',
  setCalls = [],
  traceEnabled,
  traceCalls = [],
}: {
  nodeEnv: NODE_ENV
  expectedCookie: CookieOptions
  expectedProxy: boolean
  sessionCookieName?: string
  setCalls?: any[][]
  traceEnabled?: boolean
  traceCalls: string[][]
}) {
  const dbName = 'db-name'
  const sessionSecret = 'secret'
  const sessionTimeoutSeconds = 1
  const envSpy = jest.spyOn(env, 'default').mockReturnValue({
    MONGO_DB: dbName,
    NODE_ENV: nodeEnv,
    SESSION_COOKIE_NAME: sessionCookieName,
    SESSION_SECRET: sessionSecret,
    SESSION_TIMEOUT_SECONDS: sessionTimeoutSeconds,
  } as any)
  const useSpy = jest.fn().mockImplementation()
  const setSpy = jest.fn().mockImplementation()
  Api['app'] = {
    use: useSpy,
    set: setSpy,
  } as any
  const resolvedPromise = {}
  const promiseResolveSpy = jest.spyOn(Promise, 'resolve').mockImplementation(() => resolvedPromise as any)
  const mongoStoreCreateSpy = jest.spyOn(MongoStore, 'create').mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  Api['logger'] = {
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  expect(Api['configureSession']()).toEqual(undefined)

  expect(envSpy.mock.calls).toEqual([[], [], [], [], [], []])
  expect(useSpy).toHaveBeenCalledTimes(1)
  expect(setSpy.mock.calls).toEqual(setCalls)
  expect((session as any).mock.calls).toEqual([
    [
      {
        cookie: expectedCookie,
        proxy: expectedProxy,
        name: sessionCookieName,
        resave: false,
        rolling: true,
        saveUninitialized: false,
        secret: sessionSecret,
        store: undefined,
      },
    ],
  ])
  expect(promiseResolveSpy.mock.calls).toEqual([[DbConnector.getClient()]])
  expect(mongoStoreCreateSpy.mock.calls).toEqual([
    [
      {
        clientPromise: resolvedPromise,
        dbName: dbName,
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}

async function testConfigureWebsocketServer({
  authenticateResponse,
  testOnConnect,
  traceEnabled,
  requestForwarded,
}: {
  authenticateResponse?: UserDbObject
  testOnConnect?: boolean
  traceEnabled?: boolean
  requestForwarded?: boolean
}) {
  const subscriptionPath = 'subscribe'
  const envSpy = jest.spyOn(env, 'default').mockReturnValue({
    SUBSCRIPTION_PATH: subscriptionPath,
  } as any)
  const subscriptionCleanup = {
    dispose: jest.fn().mockResolvedValue(''),
  } as unknown as Disposable
  const wsServer = {} as any
  ws.prototype = wsServer
  const useServerSpy = jest.fn().mockReturnValue(subscriptionCleanup)
  jest.spyOn(useWs, 'useServer').mockImplementation(useServerSpy)

  expect(Api['configureWebsocketServer']()).toEqual(subscriptionCleanup)

  expect(envSpy.mock.calls).toEqual([[]])
  expect(useServerSpy.mock.calls).toEqual([
    [
      {
        context: expect.any(Function),
        onConnect: expect.any(Function),
        schema,
      },
      wsServer,
    ],
  ])

  const traceSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  Api['logger'] = {
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
    debug: debugSpy,
  } as any
  const debugCalls: string[][] = []
  const traceCalls: string[][] = []

  const context = useServerSpy.mock.calls[0][0].context
  const ctx = {
    extra: {
      user: authenticateResponse,
    },
  }
  expect(context(ctx, undefined, undefined)).toEqual({
    session: {
      user: authenticateResponse,
    },
  })
  traceCalls.push([`WebSocket context user: "${JSON.stringify(authenticateResponse)}"`])

  if (testOnConnect) {
    const clientIp = '1.2.3.4'
    const forwardedIp = '5.6.7.8'
    const onConnect = useServerSpy.mock.calls[0][0].onConnect
    const ctx = {
      extra: {
        request: {
          socket: {
            remoteAddress: clientIp,
          },
          headers: {},
        },
      },
    }
    if (requestForwarded) {
      ctx.extra.request.headers = {
        'x-forwarded-for': forwardedIp,
      }
    }
    const sessionMongoStore = {
      hello: 'world',
    } as unknown as MongoStore
    Api['sessionMongoStore'] = sessionMongoStore
    const authenticateSpy = jest.spyOn(WebSocketAuth, 'authenticate').mockResolvedValue(authenticateResponse)
    traceCalls.push([`WebSocket onConnect clientIp: "${requestForwarded ? forwardedIp : clientIp}"`])
    traceCalls.push([`WebSocket onConnect user: "${JSON.stringify(authenticateResponse)}"`])
    if (authenticateResponse) {
      debugCalls.push([`Allowing WebSocket connection for user "${authenticateResponse._id}"`])
    } else {
      debugCalls.push([
        `Rejecting WebSocket connection from "${
          requestForwarded ? forwardedIp : clientIp
        }" due to authentication failure.`,
      ])
      traceCalls.push([`WebSocket onConnect headers: "${JSON.stringify(ctx.extra.request.headers)}"`])
    }

    await expect(onConnect(ctx, undefined, undefined)).resolves.toEqual(authenticateResponse ? undefined : false)

    expect((ctx.extra as any).user).toEqual(authenticateResponse)
    expect(authenticateSpy.mock.calls).toEqual([
      [
        {
          req: ctx.extra.request,
          mongoStore: sessionMongoStore,
        },
      ],
    ])
  }
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? traceCalls : [])
}

function testMaskError({ error }: { error: Error | PresentableError }) {
  const unwrapResolverErrorSpy = jest.spyOn(apolloErrors, 'unwrapResolverError').mockReturnValue(error)
  const errorSpy = jest.fn().mockImplementation()
  Api['logger'] = {
    error: errorSpy,
  } as any

  const formattedError: GraphQLFormattedError = {
    message: 'formatted-error-message',
  }

  expect(Api['maskError'](formattedError, error)).toEqual(
    error instanceof PresentableError
      ? formattedError
      : {
          message: 'Internal Server Error.',
        }
  )

  expect(unwrapResolverErrorSpy.mock.calls).toEqual([[error]])
  expect(errorSpy.mock.calls).toEqual(error instanceof PresentableError ? [] : [[formattedError]])
}
