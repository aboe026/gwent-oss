import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import cors from 'cors'
import { createServer, Server } from 'http'
import { Disposable } from 'graphql-ws'
import express, { Express, Request, Response } from 'express'
import { expressMiddleware } from '@apollo/server/express4'
import figlet from 'figlet'
import { getLogger } from 'log4js'
import { json } from 'body-parser'
import MongoStore from 'connect-mongo'
import { printSchema } from 'graphql/utilities'
import session, { CookieOptions } from 'express-session'
import { useServer } from 'graphql-ws/lib/use/ws'
import { WebSocketServer } from 'ws'

import AppInfo from './app-info'
import BasicAuth from './auth/basic-auth'
import DbConnector from './database/db-connector'
import DbUpgrader from './database/db-upgrader'
import env from './env'
import { NODE_ENV } from '@gwent/env'
import schema from './graphql/executable-schema'
import { version } from '../package.json'
import WebSocketAuth from './auth/websocket-auth'

/**
 * A class to handle startup and configuration of the API server.
 */
export default class Api {
  private static logger = getLogger('Api')
  private static app: Express
  private static apolloServer: ApolloServer
  private static httpServer: Server
  private static sessionMongoStore: MongoStore

  /**
   * Bring up the API server.
   */
  static async run() {
    await Api.printStartupInfo()
    await DbUpgrader.run()

    Api.app = express()
    Api.httpServer = createServer(Api.app)

    Api.configureSession()
    Api.exposePlainSchema()
    const subscriptionCleanup = Api.configureSubscriptionServer()
    await Api.configureApolloServer(subscriptionCleanup)

    await Api.serve()
  }

  /**
   * print relevant startup information.
   */
  private static async printStartupInfo() {
    Api.logger.info(`\n${figlet.textSync('Gwent', 'Tombstone')}`)
    Api.logger.info(`Version: "${version}"`)
    Api.logger.debug(`Build: "${await AppInfo.getBuildNumber()}"`)
    Api.logger.trace(`NODE_ENV: "${env().NODE_ENV}"`)
    Api.logger.info(`LOG_LEVEL: "${env().LOG_LEVEL}"`)
  }

  /**
   * Configure the server for user sessions.
   */
  private static configureSession() {
    const isProduction = env().NODE_ENV === NODE_ENV.Prod
    const proxy = isProduction
    Api.logger.trace(`Session timeout: "${env().SESSION_TIMEOUT_SECONDS}" second(s)`)
    const cookie: CookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: env().SESSION_TIMEOUT_SECONDS * 1000, // convert to milliseconds
    }
    Api.logger.trace(`session cookie proxy: "${proxy}"`)
    if (Api.logger.isTraceEnabled()) {
      Api.logger.trace(`cookie: "${JSON.stringify(cookie)}"`)
    }
    if (isProduction) {
      Api.logger.trace('enabling "trust proxy"')
      Api.app.set('trust proxy', 1)
    }
    Api.sessionMongoStore = MongoStore.create({
      clientPromise: Promise.resolve(DbConnector.getClient()),
      dbName: env().MONGO_DB,
    })
    Api.app.use(
      session({
        cookie,
        proxy,
        name: 'gwent.sid',
        resave: false,
        rolling: true,
        saveUninitialized: false,
        secret: env().SESSION_SECRET,
        store: Api.sessionMongoStore,
      })
    )
  }

  /**
   * Configure an endpoint to disaplay the GraphQL schema in plaintext.
   */
  private static exposePlainSchema() {
    Api.app.use('/schema', (req, res) => {
      res.set('Content-Type', 'text/plain')
      res.send(printSchema(schema))
    })
    Api.logger.debug(`GraphQL Schema is available at http://localhost:${env().PORT}/schema`)
  }

  private static configureSubscriptionServer(): Disposable {
    const wsServer = new WebSocketServer({
      server: Api.httpServer,
      path: '/subscribe',
    })

    return useServer(
      {
        schema,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        context: async (ctx, msg, args) => {
          const user = await WebSocketAuth.authenticate({
            req: ctx.extra.request,
            mongoStore: Api.sessionMongoStore,
          })
          if (Api.logger.isTraceEnabled()) {
            Api.logger.trace(`user: "${JSON.stringify(user)}"`)
          }

          return {
            user,
          }
        },
      },
      wsServer
    )
  }

  /**
   * Configure the Apollo Server for UI connections.
   */
  private static async configureApolloServer(subscriptionCleanup: Disposable) {
    Api.logger.debug('starting ApolloServer')
    Api.apolloServer = new ApolloServer({
      schema,
      csrfPrevention: true,
      cache: 'bounded',
      plugins: [
        ApolloServerPluginDrainHttpServer({
          httpServer: Api.httpServer,
        }),
        ApolloServerPluginLandingPageLocalDefault({
          embed: true,
        }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await subscriptionCleanup.dispose()
              },
            }
          },
        },
      ],
      introspection: true,
    })
    await Api.apolloServer.start()
    Api.logger.debug('ApolloServer started')
  }

  /**
   * Set context of user on requests.
   *
   * @param {Object} connection The connection being made.
   * @param connection.req The incoming request.
   * @param connection.res The outgoing response.
   * @returns An object to set as the context.
   */
  private static async setContext({ req, res }: { req: Request; res: Response }) {
    await BasicAuth.authenticate(req, res)
    return {
      session: req.session,
    }
  }

  /**
   * Set the api to listen for requests.
   */
  private static async serve() {
    Api.logger.trace(`GRAPHQL_PATH: "${env().GRAPHQL_PATH}"`)
    Api.logger.trace(`CORS_ORIGIN: "${env().CORS_ORIGIN}"`)
    Api.app.use(
      `/${env().GRAPHQL_PATH}`,
      cors({
        origin: [env().CORS_ORIGIN],
        credentials: true,
      }),
      json(),
      expressMiddleware(Api.apolloServer, {
        context: Api.setContext,
      })
    )
    Api.logger.debug(`CORS accepting requests from "${env().CORS_ORIGIN}"`)
    Api.logger.trace(`PORT: "${env().PORT}"`)
    await new Promise<void>((resolve) => Api.httpServer.listen({ port: env().PORT }, resolve))
    Api.logger.info(
      `GraphQL Queries and Mutations listening at: "http://localhost:${env().PORT}/${env().GRAPHQL_PATH}"`
    )
    Api.logger.info(
      `GraphQL Subscription Websocket available at: "ws://localhost:${env().PORT}/${env().SUBSCRIPTION_PATH}"`
    )
  }
}
