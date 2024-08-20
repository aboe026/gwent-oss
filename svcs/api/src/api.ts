import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { createServer, Server } from 'http'
import cors from 'cors'
import express, { Express, Request, Response } from 'express'
import { expressMiddleware } from '@apollo/server/express4'
import figlet from 'figlet'
import { json } from 'body-parser'
import log4js from 'log4js'
import MongoStore from 'connect-mongo'
import { printSchema } from 'graphql/utilities'
import session, { CookieOptions } from 'express-session'

import AppInfo from './app-info'
import BasicAuth from './auth/basic-auth'
import DbConnector from './database/db-connector'
import DbUpgrader from './database/db-upgrader'
import env from './env'
import schema from './graphql/executable-schema'
import { version } from '../package.json'
import { NODE_ENV } from '@gwent/env'

/**
 * A class to handle startup and configuration of the API server.
 */
export default class Api {
  private static logger = log4js.getLogger('Api')
  private static app: Express
  private static apolloServer: ApolloServer
  private static httpServer: Server

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
    await Api.configureApolloServer()

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
    Api.app.use(
      session({
        cookie,
        proxy,
        name: 'gwent.sid',
        resave: false,
        rolling: true,
        saveUninitialized: false,
        secret: env().SESSION_SECRET,
        store: MongoStore.create({
          clientPromise: Promise.resolve(DbConnector.getClient()),
          dbName: env().MONGO_DB,
        }),
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

  /**
   * Configure the Apollo Server for UI connections.
   */
  private static async configureApolloServer() {
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
    Api.logger.info(`GraphQL API listening at: "http://localhost:${env().PORT}/${env().GRAPHQL_PATH}"`)
  }
}
