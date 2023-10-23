import env from './env' // import env first so any dependent packages/code get correct/resolved environment variables

import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import cors from 'cors'
import { DIRECTIVES } from '@graphql-codegen/typescript-mongodb'
import express from 'express'
import { expressMiddleware } from '@apollo/server/express4'
import http from 'http'
import { json } from 'body-parser'
import log4js from 'log4js'

import DbUpgrader from './database/db-upgrader'
import schema from './graphql/schema'
import resolver from './graphql/resolvers'

log4js.configure({
  appenders: { out: { type: 'stdout' } },
  categories: { default: { appenders: ['out'], level: env().LOG_LEVEL } },
})
const logger = log4js.getLogger('api')

/**
 * The entrypoint of the API Server
 */
;(async () => {
  try {
    logger.info('Starting gwent API server...')
    await DbUpgrader.run()
    const app = express()
    const httpServer = http.createServer(app)
    const server = new ApolloServer({
      typeDefs: [DIRECTIVES, schema],
      resolvers: [resolver],
      csrfPrevention: true,
      cache: 'bounded',
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        ApolloServerPluginLandingPageLocalDefault({ embed: true }),
      ],
    })
    logger.debug('starting ApolloServer')
    await server.start()
    logger.debug('ApolloServer started')
    logger.trace(`GRAPHQL_PATH: "${env().GRAPHQL_PATH}"`)
    logger.trace(`CORS_ORIGIN: "${env().CORS_ORIGIN}"`)
    app.use(
      `/${env().GRAPHQL_PATH}`,
      cors({
        origin: [env().CORS_ORIGIN],
      }),
      json(),
      expressMiddleware(server as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    )
    logger.trace(`PORT: "${env().PORT}"`)
    await new Promise<void>((resolve) => httpServer.listen({ port: env().PORT }, resolve))
    logger.info(`GraphQL API listening at: "http://localhost:${env().PORT}/${env().GRAPHQL_PATH}"`)
    logger.info(`CORS accepting requests from "${env().CORS_ORIGIN}"`)
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
})()
