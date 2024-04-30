import { ApolloServer } from '@apollo/server'
import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import figlet from 'figlet'
import http from 'http'
import MongoStore from 'connect-mongo'
import session, { CookieOptions } from 'express-session'

import Api from '../../src/api'
import AppInfo from '../../src/app-info'
import BasicAuth from '../../src/auth/basic-auth'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import * as env from '../../src/env'
import { NODE_ENV } from '@gwent/env'
import { version } from '../../package.json'

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
jest.mock('@apollo/server/express4', () => {
  return {
    expressMiddleware: jest.fn().mockImplementation(),
  }
})

describe('Api', () => {
  describe('run', () => {
    it('calls to appropriate methods', async () => {
      const printStartupInfoSpy = jest.spyOn(Api as any, 'printStartupInfo').mockImplementation()
      const dbUpgraderRunSpy = jest.spyOn(DbUpgrader, 'run').mockImplementation()
      const createServerSpy = jest.spyOn(http, 'createServer').mockImplementation()
      const configureSessionSpy = jest.spyOn(Api as any, 'configureSession').mockImplementation()
      const exposePlainSchemaSpy = jest.spyOn(Api as any, 'exposePlainSchema').mockImplementation()
      const configureApolloServerSpy = jest.spyOn(Api as any, 'configureApolloServer').mockImplementation()
      const serveSpy = jest.spyOn(Api as any, 'serve').mockImplementation()

      await expect(Api.run()).resolves.toEqual(undefined)

      expect(printStartupInfoSpy.mock.calls).toEqual([[]])
      expect(dbUpgraderRunSpy.mock.calls).toEqual([[]])
      expect((express as any).mock.calls).toEqual([[]])
      expect(createServerSpy.mock.calls).toEqual([[undefined]])
      expect(configureSessionSpy.mock.calls).toEqual([[]])
      expect(exposePlainSchemaSpy.mock.calls).toEqual([[]])
      expect(configureApolloServerSpy.mock.calls).toEqual([[]])
      expect(serveSpy.mock.calls).toEqual([[]])
    })
  })
  describe('printStartupInfo', () => {
    it('logs out correct information', async () => {
      const text = 'Gwent'
      const buildNumber = 0
      const nodeEnv = 'development'
      const textSyncSpy = jest.spyOn(figlet, 'textSync').mockReturnValue(text)
      const getBuildNumberSpy = jest.spyOn(AppInfo, 'getBuildNumber').mockResolvedValue(0)
      const envSpy = jest.spyOn(env, 'default').mockReturnValue({
        NODE_ENV: nodeEnv,
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

      expect(textSyncSpy.mock.calls).toEqual([['Gwent', 'Tombstone']])
      expect(getBuildNumberSpy.mock.calls).toEqual([[]])
      expect(envSpy.mock.calls).toEqual([[]])
      expect(infoSpy.mock.calls).toEqual([[`\n${text}`], [`Version: "${version}"`]])
      expect(debugSpy.mock.calls).toEqual([[`Build: "${buildNumber}"`]])
      expect(traceSpy.mock.calls).toEqual([[`NODE_ENV: "${nodeEnv}"`]])
    })
  })
  describe('configureSession', () => {
    it('calls to create session on app for development node env', () => {
      testConfigureSession({
        nodeEnv: NODE_ENV.Dev,
        expectedCookie: {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 1000,
        },
        expectedProxy: false,
        traces: [['Session timeout: "1" second(s)'], ['session cookie proxy: "false"']],
      })
    })
    it('calls to create session on app for production node env', () => {
      testConfigureSession({
        nodeEnv: NODE_ENV.Prod,
        expectedCookie: {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 1000,
        },
        expectedProxy: true,
        setCalls: [['trust proxy', 1]],
        traces: [['Session timeout: "1" second(s)'], ['session cookie proxy: "true"'], ['enabling "trust proxy"']],
      })
    })
    it('calls out to trace if enabled', () => {
      const cookie: CookieOptions = {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000,
      }
      testConfigureSession({
        nodeEnv: NODE_ENV.Dev,
        expectedCookie: cookie,
        expectedProxy: false,
        traceEnabled: true,
        traces: [
          ['Session timeout: "1" second(s)'],
          ['session cookie proxy: "false"'],
          [`cookie: "${JSON.stringify(cookie)}"`],
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

      await expect(Api['configureApolloServer']()).resolves.toEqual(undefined)

      expect(Api['apolloServer']).not.toEqual(undefined)
      expect(ApolloServer).toHaveBeenCalledTimes(1)
      expect(startSpy.mock.calls).toEqual([[]])
      expect(debugSpy.mock.calls).toEqual([['starting ApolloServer'], ['ApolloServer started']])
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
      const corsOrigin = 'localhost'
      const port = 4000
      const envSpy = jest.spyOn(env, 'default').mockReturnValue({
        GRAPHQL_PATH: graphqlPath,
        CORS_ORIGIN: corsOrigin,
        PORT: port,
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
      expect(envSpy.mock.calls).toEqual([[], [], [], [], [], [], [], [], []])
      expect(jsonSpy.mock.calls).toEqual([[]])
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
      expect(infoSpy.mock.calls).toEqual([[`GraphQL API listening at: "http://localhost:${port}/${graphqlPath}"`]])
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
  setCalls = [],
  traceEnabled,
  traces = [],
}: {
  nodeEnv: NODE_ENV
  expectedCookie: CookieOptions
  expectedProxy: boolean
  setCalls?: any[][]
  traceEnabled?: boolean
  traces: string[][]
}) {
  const sessionTimeoutSeconds = 1
  const sessionSecret = 'secret'
  const dbName = 'db-name'
  const envSpy = jest.spyOn(env, 'default').mockReturnValue({
    NODE_ENV: nodeEnv,
    SESSION_TIMEOUT_SECONDS: sessionTimeoutSeconds,
    SESSION_SECRET: sessionSecret,
    MONGO_DB: dbName,
  } as any)
  const useSpy = jest.fn().mockImplementation()
  const setSpy = jest.fn().mockImplementation()
  Api['app'] = {
    use: useSpy,
    set: setSpy,
  } as any
  const mongoStoreCreateSpy = jest.spyOn(MongoStore, 'create').mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  Api['logger'] = {
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  expect(Api['configureSession']()).toEqual(undefined)

  expect(envSpy.mock.calls).toEqual([[], [], [], [], []])
  expect(useSpy).toHaveBeenCalledTimes(1)
  expect(setSpy.mock.calls).toEqual(setCalls)
  expect((session as any).mock.calls).toEqual([
    [
      {
        cookie: expectedCookie,
        proxy: expectedProxy,
        name: 'gwent.sid',
        resave: false,
        rolling: true,
        saveUninitialized: false,
        secret: sessionSecret,
        store: undefined,
      },
    ],
  ])
  expect(mongoStoreCreateSpy.mock.calls).toEqual([
    [
      {
        clientPromise: Promise.resolve(DbConnector.getClient()),
        dbName: dbName,
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(traces)
}
